import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Fecha actual y del mes pasado
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Ventas del mes actual
    const salesThisMonth = await prisma.sale.aggregate({
      where: {
        saleDate: {
          gte: startOfMonth
        },
        status: {
          not: 'borrador'
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    })

    // Ventas del mes pasado
    const salesLastMonth = await prisma.sale.aggregate({
      where: {
        saleDate: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        },
        status: {
          not: 'borrador'
        }
      },
      _sum: {
        total: true
      }
    })

    // Clientes activos
    const activeCustomers = await prisma.customer.count({
      where: {
        isActive: true
      }
    })

    // Nuevos clientes este mes
    const newCustomersThisMonth = await prisma.customer.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    // Presupuestos pendientes
    const pendingQuotes = await prisma.quote.aggregate({
      where: {
        status: 'enviado',
        validUntil: {
          gte: now
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    })

    // Ventas de hoy
    const salesToday = await prisma.sale.aggregate({
      where: {
        saleDate: {
          gte: startOfToday
        },
        status: {
          not: 'borrador'
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    })

    // Calcular porcentaje de crecimiento
    const salesGrowth = salesLastMonth._sum.total && salesLastMonth._sum.total > 0
      ? ((salesThisMonth._sum.total || 0) - salesLastMonth._sum.total) / salesLastMonth._sum.total * 100
      : 0

    return NextResponse.json({
      salesThisMonth: {
        total: salesThisMonth._sum.total || 0,
        count: salesThisMonth._count.id,
        growth: Math.round(salesGrowth * 10) / 10
      },
      activeCustomers: {
        total: activeCustomers,
        newThisMonth: newCustomersThisMonth
      },
      pendingQuotes: {
        total: pendingQuotes._sum.total || 0,
        count: pendingQuotes._count.id
      },
      salesToday: {
        total: salesToday._sum.total || 0,
        count: salesToday._count.id
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 