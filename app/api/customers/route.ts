import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    
    const customers = await prisma.customer.findMany({
      where: {
        ...(search && {
          OR: [
            { businessName: { contains: search, mode: 'insensitive' } },
            { contactName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { taxId: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(isActive !== null && { isActive: isActive === 'true' })
      },
      include: {
        _count: {
          select: {
            sales: true,
            quotes: true,
            currentAccountItems: true
          }
        }
      },
      orderBy: {
        businessName: 'asc'
      }
    })

    // Calcular saldo de cuenta corriente para cada cliente
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const lastBalance = await prisma.currentAccountItem.findFirst({
          where: { customerId: customer.id },
          orderBy: { date: 'desc' }
        })
        
        return {
          ...customer,
          currentBalance: lastBalance?.balance || 0
        }
      })
    )

    return NextResponse.json(customersWithBalance)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const customer = await prisma.customer.create({
      data: {
        businessName: data.businessName,
        taxId: data.taxId,
        customerType: data.customerType,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        address: data.address,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        notes: data.notes,
        creditLimit: data.creditLimit,
        paymentTerms: data.paymentTerms,
        priceList: data.priceList,
        discount: data.discount
      }
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    console.error('Error creating customer:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este CUIT/CUIL' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 