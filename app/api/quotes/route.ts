import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculateFiscalAmounts, getInvoiceTypeForCustomer, calculateIVA, SaleItemForCalculation } from '@/lib/fiscal-utils'

const prisma = new PrismaClient()

// GET - Obtener lista de presupuestos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    if (status) where.status = status
    if (customerId) where.customerId = customerId

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              businessName: true,
              contactName: true,
              taxId: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  ivaType: true
                }
              }
            }
          },
          _count: {
            select: {
              sales: true
            }
          }
        },
        orderBy: { quoteDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.quote.count({ where })
    ])

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error al obtener presupuestos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear nuevo presupuesto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, items, notes, terms, validUntil } = body

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Cliente e items son obligatorios' }, { status: 400 })
    }

    // Obtener información del cliente
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Generar número de presupuesto
    const lastQuote = await prisma.quote.findFirst({
      orderBy: { quoteNumber: 'desc' }
    })

    const nextNumber = lastQuote 
      ? parseInt(lastQuote.quoteNumber.split('-')[1]) + 1 
      : 1

    const quoteNumber = `P-${nextNumber.toString().padStart(8, '0')}`

    // Calcular totales
    let subtotal = 0
    const processedItems: Array<{
      productId: string
      quantity: number
      unitPrice: number
      discount: number
      subtotal: number
      description?: string
      ivaType: string
      ivaAmount: number
      totalAmount: number
    }> = []

    const itemsForFiscalCalculation: SaleItemForCalculation[] = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json({ error: `Producto ${item.productId} no encontrado` }, { status: 404 })
      }

      const discount = item.discount || 0
      const itemSubtotal = item.quantity * item.unitPrice * (1 - discount / 100)
      const ivaAmount = calculateIVA(itemSubtotal, product.ivaType)
      const totalAmount = itemSubtotal + ivaAmount
      
      processedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount,
        subtotal: itemSubtotal,
        description: item.description || '',
        ivaType: product.ivaType,
        ivaAmount,
        totalAmount
      })

      itemsForFiscalCalculation.push({
        subtotal: itemSubtotal,
        ivaType: product.ivaType,
        ivaAmount
      })

      subtotal += itemSubtotal
    }

    // Calcular montos fiscales totales
    const totalFiscalAmounts = calculateFiscalAmounts(itemsForFiscalCalculation)

    // Crear el presupuesto
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId,
        quoteDate: new Date(),
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
        status: 'enviado',
        subtotal,
        taxAmount: totalFiscalAmounts.taxAmount,
        total: totalFiscalAmounts.total,
        notes,
        terms,
        items: {
          create: processedItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            subtotal: item.subtotal,
            description: item.description,
            ivaType: item.ivaType as any,
            ivaAmount: item.ivaAmount,
            totalAmount: item.totalAmount
          }))
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Error al crear presupuesto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 