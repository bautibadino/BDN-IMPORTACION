import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculateFiscalAmounts, calculateIVA, SaleItemForCalculation } from '@/lib/fiscal-utils'

const prisma = new PrismaClient()

// GET - Obtener presupuesto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        sales: {
          select: {
            id: true,
            saleNumber: true,
            saleDate: true,
            status: true,
            total: true
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error al obtener presupuesto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar presupuesto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customerId, items, notes, terms, validUntil, status } = body

    // Verificar que el presupuesto existe
    const existingQuote = await prisma.quote.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingQuote) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    // Obtener información del cliente
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

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

    // Actualizar el presupuesto en una transacción
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Eliminar items existentes
      await tx.quoteItem.deleteMany({
        where: { quoteId: id }
      })

      // Actualizar el presupuesto
      const quote = await tx.quote.update({
        where: { id },
        data: {
          customerId,
          subtotal,
          taxAmount: totalFiscalAmounts.taxAmount,
          total: totalFiscalAmounts.total,
          notes,
          terms,
          validUntil: validUntil ? new Date(validUntil) : undefined,
          status: status || existingQuote.status,
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

      return quote
    })

    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error('Error al actualizar presupuesto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar presupuesto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar que el presupuesto existe
    const existingQuote = await prisma.quote.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sales: true
          }
        }
      }
    })

    if (!existingQuote) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    // Verificar si tiene ventas asociadas
    if (existingQuote._count.sales > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el presupuesto porque tiene ventas asociadas' 
      }, { status: 400 })
    }

    // Eliminar el presupuesto y sus items (cascade)
    await prisma.quote.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Presupuesto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Convertir presupuesto a venta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action !== 'convert-to-sale') {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    // Obtener el presupuesto
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    if (quote.status === 'aceptado') {
      return NextResponse.json({ error: 'El presupuesto ya fue convertido a venta' }, { status: 400 })
    }

    // Generar número de venta
    const lastSale = await prisma.sale.findFirst({
      orderBy: { saleNumber: 'desc' }
    })

    const nextNumber = lastSale 
      ? parseInt(lastSale.saleNumber.split('-')[1]) + 1 
      : 1

    const saleNumber = `V-${nextNumber.toString().padStart(8, '0')}`

    // Crear la venta en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: quote.customerId,
          saleDate: new Date(),
          status: 'confirmada',
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          total: quote.total,
          notes: quote.notes,
          quoteId: quote.id,
          invoiceType: 'FACTURA_B', // Por defecto, se puede calcular según el cliente
          items: {
            create: quote.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal: item.subtotal,
              description: item.description,
              ivaType: item.ivaType,
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

      // Actualizar el estado del presupuesto
      await tx.quote.update({
        where: { id },
        data: { status: 'aceptado' }
      })

      return sale
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error al convertir presupuesto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 