import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Ventas recientes (últimas 5)
    const recentSales = await prisma.sale.findMany({
      where: {
        status: {
          not: 'borrador'
        }
      },
      include: {
        customer: {
          select: {
            businessName: true
          }
        }
      },
      orderBy: {
        saleDate: 'desc'
      },
      take: 5
    })

    // Presupuestos por vencer (próximos 30 días)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const expiringQuotes = await prisma.quote.findMany({
      where: {
        status: 'enviado',
        validUntil: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        customer: {
          select: {
            businessName: true
          }
        }
      },
      orderBy: {
        validUntil: 'asc'
      },
      take: 5
    })

    // Formatear datos para el frontend
    const formattedSales = recentSales.map(sale => ({
      id: sale.saleNumber,
      cliente: sale.customer.businessName,
      total: sale.total,
      estado: sale.status,
      fecha: sale.saleDate
    }))

    const formattedQuotes = expiringQuotes.map(quote => {
      const daysUntilExpiry = Math.ceil((quote.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      let expiryText = ''
      
      if (daysUntilExpiry === 0) {
        expiryText = 'Hoy'
      } else if (daysUntilExpiry === 1) {
        expiryText = '1 día'
      } else if (daysUntilExpiry <= 7) {
        expiryText = `${daysUntilExpiry} días`
      } else {
        expiryText = `${Math.ceil(daysUntilExpiry / 7)} semana${Math.ceil(daysUntilExpiry / 7) > 1 ? 's' : ''}`
      }

      return {
        id: quote.quoteNumber,
        cliente: quote.customer.businessName,
        total: quote.total,
        vence: expiryText,
        validUntil: quote.validUntil
      }
    })

    return NextResponse.json({
      recentSales: formattedSales,
      expiringQuotes: formattedQuotes
    })
  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 