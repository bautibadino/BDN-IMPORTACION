import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createCurrentAccountMovement, getCurrentBalance, getCustomerAccountStatement } from '@/lib/current-account'

const prisma = new PrismaClient()

// GET - Obtener movimientos de cuenta corriente
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const type = searchParams.get('type')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Construir condiciones de filtro
    const where: any = {}
    
    if (customerId && customerId !== 'all') {
      where.customerId = customerId
    }
    
    if (type && type !== 'all') {
      where.type = type
    }
    
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo + 'T23:59:59.999Z')
      }
    }

    const [items, total] = await Promise.all([
      prisma.currentAccountItem.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              businessName: true,
              contactName: true
            }
          },
          payment: {
            select: {
              paymentNumber: true,
              method: true
            }
          },
          invoice: {
            select: {
              invoiceNumber: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.currentAccountItem.count({ where })
    ])

    // Calcular balance actual solo si se especifica un cliente
    let currentBalance = 0
    if (customerId && customerId !== 'all') {
      const lastItem = await prisma.currentAccountItem.findFirst({
        where: { customerId },
        orderBy: { createdAt: 'desc' }
      })
      currentBalance = lastItem?.balance || 0
    }

    return NextResponse.json({
      items,
      currentBalance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching current account:', error)
    return NextResponse.json(
      { error: 'Error al obtener cuenta corriente' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo movimiento de cuenta corriente
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { 
      customerId, 
      type, 
      concept, 
      amount, 
      reference, 
      paymentId, 
      invoiceId,
      date,
      notes 
    } = data

    // Validaciones básicas
    if (!customerId || !type || !concept || !amount) {
      return NextResponse.json(
        { error: 'Datos incompletos: customerId, type, concept y amount son requeridos' },
        { status: 400 }
      )
    }

    if (!['debe', 'haber'].includes(type)) {
      return NextResponse.json(
        { error: 'El tipo debe ser "debe" o "haber"' },
        { status: 400 }
      )
    }

    // Usar la función centralizada
    const result = await createCurrentAccountMovement({
      customerId,
      type,
      concept,
      amount,
      reference,
      paymentId,
      invoiceId,
      date: date ? new Date(date) : undefined,
      notes
    })

    return NextResponse.json({
      success: true,
      item: result.item,
      newBalance: result.newBalance,
      previousBalance: result.previousBalance,
      message: 'Movimiento de cuenta corriente registrado exitosamente'
    })
  } catch (error) {
    console.error('Error creating current account item:', error)
    return NextResponse.json(
      { error: 'Error al crear movimiento de cuenta corriente' },
      { status: 500 }
    )
  }
}

// GET - Obtener balance por cliente
export async function GET_BALANCE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'ID de cliente es obligatorio' }, { status: 400 })
    }

    // Calcular balance
    const result = await prisma.currentAccountItem.aggregate({
      where: { customerId },
      _sum: { amount: true }
    })

    const balance = result._sum.amount || 0

         // Obtener últimos movimientos
     const recentItems = await prisma.currentAccountItem.findMany({
       where: { customerId },
       include: {
         invoice: {
           select: {
             id: true,
             invoiceNumber: true,
             invoiceDate: true
           }
         },
         payment: {
           select: {
             id: true,
             paymentNumber: true,
             paymentDate: true
           }
         }
       },
       orderBy: { date: 'desc' },
       take: 10
     })

    return NextResponse.json({
      customerId,
      balance,
      recentItems
    })
  } catch (error) {
    console.error('Error al obtener balance:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 