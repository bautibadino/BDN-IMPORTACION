import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculateFiscalAmounts, getInvoiceTypeForCustomer, calculateIVA, SaleItemForCalculation } from '@/lib/fiscal-utils'

const prisma = new PrismaClient()

// GET - Obtener venta por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sale = await prisma.sale.findUnique({
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

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error al obtener venta:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar venta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customerId, items, notes } = body

    // Verificar que la venta existe
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingSale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
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

      const itemSubtotal = item.quantity * item.unitPrice
      const ivaAmount = calculateIVA(itemSubtotal, product.ivaType)
      const totalAmount = itemSubtotal + ivaAmount
      
      processedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
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
    const invoiceType = getInvoiceTypeForCustomer(customer.customerType)

    // Actualizar la venta en una transacción
    const updatedSale = await prisma.$transaction(async (tx) => {
      // Eliminar items existentes
      await tx.saleItem.deleteMany({
        where: { saleId: id }
      })

      // Actualizar la venta
      const sale = await tx.sale.update({
        where: { id },
        data: {
          customerId,
          subtotal,
          total: totalFiscalAmounts.total,
          taxAmount: totalFiscalAmounts.taxAmount,
          invoiceType,
          taxedAmount: totalFiscalAmounts.taxedAmount,
          nonTaxedAmount: totalFiscalAmounts.nonTaxedAmount,
          exemptAmount: totalFiscalAmounts.exemptAmount,
          notes,
          items: {
            create: processedItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
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

      return sale
    })

    return NextResponse.json(updatedSale)
  } catch (error) {
    console.error('Error al actualizar venta:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar venta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verificar que la venta existe
    const existingSale = await prisma.sale.findUnique({
      where: { id }
    })

    if (!existingSale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Eliminar la venta y sus items (cascade)
    await prisma.sale.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Venta eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar venta:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 