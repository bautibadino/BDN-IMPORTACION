import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { saleDate: 'desc' },
          take: 10,
          select: {
            id: true,
            saleNumber: true,
            saleDate: true,
            status: true,
            total: true
          }
        },
        quotes: {
          orderBy: { quoteDate: 'desc' },
          take: 10,
          select: {
            id: true,
            quoteNumber: true,
            quoteDate: true,
            status: true,
            total: true
          }
        },
        currentAccountItems: {
          orderBy: { date: 'desc' },
          take: 10
        },
        _count: {
          select: {
            sales: true,
            quotes: true,
            currentAccountItems: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const {
      businessName,
      taxId,
      customerType,
      contactName,
      email,
      phone,
      whatsapp,
      address,
      city,
      province,
      postalCode,
      notes,
      isActive,
      creditLimit,
      paymentTerms,
      priceList,
      discount
    } = body

    // Verificar que el cliente existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Verificar CUIT único si se está cambiando
    if (taxId && taxId !== existingCustomer.taxId) {
      const existingTaxId = await prisma.customer.findFirst({
        where: { 
          taxId,
          id: { not: id }
        }
      })

      if (existingTaxId) {
        return NextResponse.json({ error: 'Ya existe un cliente con este CUIT/CUIL' }, { status: 400 })
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        businessName,
        taxId,
        customerType,
        contactName,
        email,
        phone,
        whatsapp,
        address,
        city,
        province,
        postalCode,
        notes,
        isActive,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        paymentTerms: paymentTerms ? parseInt(paymentTerms) : null,
        priceList,
        discount: discount ? parseFloat(discount) : null
      },
      include: {
        _count: {
          select: {
            sales: true,
            quotes: true
          }
        }
      }
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar que el cliente existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sales: true,
            quotes: true,
            currentAccountItems: true
          }
        }
      }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Verificar si tiene ventas, presupuestos o movimientos de cuenta corriente
    if (existingCustomer._count.sales > 0 || 
        existingCustomer._count.quotes > 0 || 
        existingCustomer._count.currentAccountItems > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el cliente porque tiene ventas, presupuestos o movimientos de cuenta corriente asociados' 
      }, { status: 400 })
    }

    // Eliminar el cliente
    await prisma.customer.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 