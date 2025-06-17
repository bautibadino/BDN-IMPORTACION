import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createSaleMovement } from '@/lib/current-account'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const sales = await prisma.sale.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(customerId && { customerId })
      },
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
                internalCode: true
              }
            }
          }
        },
        _count: {
          select: {
            payments: true
          }
        }
      },
      orderBy: {
        saleDate: 'desc'
      },
      skip,
      take: limit
    })

    const total = await prisma.sale.count({
      where: {
        ...(status && { status: status as any }),
        ...(customerId && { customerId })
      }
    })

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let data: any = null
  
  try {
    data = await request.json()
    
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

    // Validar quote si se proporciona
    if (data.quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: data.quoteId }
      })
      
      if (!quote) {
        return NextResponse.json(
          { error: 'Presupuesto no encontrado' },
          { status: 400 }
        )
      }
    }

    // Validar productos y stock
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })
      
      if (!product) {
        return NextResponse.json(
          { error: `Producto ${item.productId} no encontrado` },
          { status: 400 }
        )
      }
      
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}` },
          { status: 400 }
        )
      }
    }
    
    // Generar número de venta
    const lastSale = await prisma.sale.findFirst({
      orderBy: { saleNumber: 'desc' }
    })
    
    let nextNumber = 1
    if (lastSale) {
      const lastNumber = parseInt(lastSale.saleNumber.split('-')[1])
      nextNumber = lastNumber + 1
    }
    
    const saleNumber = `V-${nextNumber.toString().padStart(8, '0')}`

    // Calcular totales si no vienen en el request
    let subtotal = data.subtotal || 0
    let taxAmount = data.taxAmount || 0
    let total = data.total || 0
    
    if (!data.subtotal) {
      subtotal = data.items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
    }
    
    if (!data.taxAmount) {
      taxAmount = data.items.reduce((sum: number, item: any) => sum + (item.ivaAmount || 0), 0)
    }
    
    if (!data.total) {
      total = subtotal + taxAmount
    }

    // Crear la venta con items
    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        customerId: data.customerId,
        status: data.status || 'confirmada',
        isWhiteInvoice: data.isWhiteInvoice !== undefined ? data.isWhiteInvoice : true,
        saleDate: new Date(data.saleDate || Date.now()),
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        
        // Información fiscal
        invoiceType: data.invoiceType || 'FACTURA_B',
        pointOfSale: data.pointOfSale || '0001',
        taxedAmount: data.taxedAmount || subtotal,
        nonTaxedAmount: data.nonTaxedAmount || 0,
        exemptAmount: data.exemptAmount || 0,
        grossIncomePerception: data.grossIncomePerception || 0,
        
        // Totales (CAMPOS OBLIGATORIOS)
        subtotal: subtotal,
        taxAmount: taxAmount,
        discountAmount: data.discountAmount || 0,
        total: total,
        
        notes: data.notes,
        internalNotes: data.internalNotes,
        quoteId: data.quoteId && data.quoteId !== '' ? data.quoteId : null,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
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
        }
      }
    })

    // Actualizar stock de productos
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })
    }

    // Crear automáticamente el movimiento en cuenta corriente
    // Solo para ventas confirmadas (tanto en blanco como en negro)
    await createSaleMovement({
      id: sale.id,
      saleNumber: sale.saleNumber,
      customerId: sale.customerId,
      total: sale.total,
      saleDate: sale.saleDate,
      isWhiteInvoice: sale.isWhiteInvoice,
      status: sale.status
    })

    return NextResponse.json(sale)
  } catch (error: any) {
    console.error('Error creating sale:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    
    // Mejor manejo de errores específicos
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        // Log específico para ayudar con el debugging
                 console.error('Foreign key constraint violation. Data sent:', {
           customerId: data?.customerId,
           quoteId: data?.quoteId,
           items: data?.items?.map((item: any) => ({ productId: item.productId }))
         })
        
        return NextResponse.json(
          { error: 'Error de referencia: Verifique que el cliente y productos existan' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Ya existe una venta con este número' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 