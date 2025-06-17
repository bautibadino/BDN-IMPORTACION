import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createCurrentAccountMovement } from '@/lib/current-account'

const prisma = new PrismaClient()

// GET - Obtener notas de crédito
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const originalSaleId = searchParams.get('originalSaleId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Construir filtros
    const where: any = {}
    
    if (customerId && customerId !== 'all') {
      where.customerId = customerId
    }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (type && type !== 'all') {
      where.type = type
    }

    if (originalSaleId) {
      where.originalSaleId = originalSaleId
    }

    const [creditNotes, total] = await Promise.all([
      prisma.creditNote.findMany({
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
          originalSale: {
            select: {
              id: true,
              saleNumber: true,
              total: true
            }
          },
          originalInvoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  internalCode: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.creditNote.count({ where })
    ])

    return NextResponse.json({
      creditNotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching credit notes:', error)
    return NextResponse.json(
      { error: 'Error al obtener notas de crédito' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva nota de crédito
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validaciones básicas
    if (!data.customerId || !data.reason || !data.description || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos: customerId, reason, description e items son requeridos' },
        { status: 400 }
      )
    }

    // Validar que el cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 400 }
      )
    }

    // Validar venta original si se proporciona
    if (data.originalSaleId) {
      const originalSale = await prisma.sale.findUnique({
        where: { id: data.originalSaleId }
      })

      if (!originalSale) {
        return NextResponse.json(
          { error: 'Venta original no encontrada' },
          { status: 400 }
        )
      }

      // NUEVA VALIDACIÓN: Verificar que no exista ya una nota de crédito para esta venta
      const existingCreditNote = await prisma.creditNote.findFirst({
        where: { 
          originalSaleId: data.originalSaleId,
          status: { not: 'anulada' } // Excluir notas anuladas
        }
      })

      if (existingCreditNote) {
        return NextResponse.json(
          { 
            error: `Ya existe una nota de crédito (${existingCreditNote.creditNoteNumber}) para esta venta. Solo se permite una nota de crédito por venta.` 
          },
          { status: 400 }
        )
      }
    }

    // Generar número de nota de crédito
    const lastCreditNote = await prisma.creditNote.findFirst({
      orderBy: { creditNoteNumber: 'desc' }
    })

    let nextNumber = 1
    if (lastCreditNote) {
      const lastNumber = parseInt(lastCreditNote.creditNoteNumber.split('-')[1])
      nextNumber = lastNumber + 1
    }

    const creditNoteNumber = `NC-${nextNumber.toString().padStart(8, '0')}`

    // Determinar tipo de nota según el tipo de cliente
    let noteType = 'NOTA_CREDITO_B' // Por defecto
    if (customer.customerType === 'responsable_inscripto') {
      noteType = 'NOTA_CREDITO_A'
    } else if (customer.customerType === 'consumidor_final') {
      noteType = 'NOTA_CREDITO_B'
    }

    // Calcular totales
    const subtotal = data.items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
    const taxAmount = data.items.reduce((sum: number, item: any) => sum + (item.ivaAmount || 0), 0)
    const total = subtotal + taxAmount

    // Crear la nota de crédito con items
    const creditNote = await prisma.creditNote.create({
      data: {
        creditNoteNumber,
        type: noteType as any,
        status: data.status || 'emitida',
        reason: data.reason,
        description: data.description,
        notes: data.notes,
        subtotal,
        taxAmount,
        total,
        customerId: data.customerId,
        originalSaleId: data.originalSaleId || null,
        originalInvoiceId: data.originalInvoiceId || null,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            description: item.description,
            ivaType: item.ivaType || 'iva_21',
            ivaAmount: item.ivaAmount || 0,
            totalAmount: item.totalAmount || item.subtotal
          }))
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        originalSale: true
      }
    })

    // Si es una nota de crédito (no débito), restaurar stock si corresponde
    if (data.reason === 'devolucion' || data.reason === 'anulacion') {
      for (const item of data.items) {
        if (item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity // Restaurar stock
              }
            }
          })
        }
      }
    }

    // Crear movimiento en cuenta corriente
    // Nota de crédito = HABER (reduce la deuda del cliente)
    await createCurrentAccountMovement({
      customerId: creditNote.customerId,
      type: 'haber',
      concept: `Nota de Crédito ${creditNote.creditNoteNumber}`,
      amount: creditNote.total,
      reference: creditNote.creditNoteNumber,
      date: creditNote.issueDate,
      notes: `${data.reason} - ${creditNote.description}`,
      creditNoteId: creditNote.id
    })

    return NextResponse.json(creditNote)
  } catch (error) {
    console.error('Error creating credit note:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 