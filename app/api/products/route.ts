import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    const products = await prisma.product.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search } },
            { internalCode: { contains: search } }
          ]
        })
      },
      select: {
        id: true,
        name: true,
        internalCode: true,
        finalPriceArs: true,
        stock: true,
        location: true,
        ivaType: true,
        unit: true,
        description: true,
        minStock: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 50
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 