const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleData() {
  console.log('🔄 Creando datos de ejemplo...')

  try {
    // Verificar si ya existen ventas
    const existingSales = await prisma.sale.count()
    if (existingSales > 0) {
      console.log('✅ Ya existen ventas en el sistema')
      return
    }

    // Obtener clientes y productos existentes
    const customers = await prisma.customer.findMany({ take: 3 })
    const products = await prisma.product.findMany({ take: 5 })

    if (customers.length === 0 || products.length === 0) {
      console.log('❌ No hay clientes o productos suficientes')
      return
    }

    console.log(`📦 Encontrados ${customers.length} clientes y ${products.length} productos`)

    // Crear algunas ventas de ejemplo
    const salesData = [
      {
        customerId: customers[0].id,
        status: 'confirmada',
        saleDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
        total: 125000,
        subtotal: 103305.79,
        taxAmount: 21694.21,
        invoiceType: 'FACTURA_B',
        taxedAmount: 103305.79,
        isWhiteInvoice: true
      },
      {
        customerId: customers[1].id,
        status: 'confirmada',
        saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
        total: 89500,
        subtotal: 73966.94,
        taxAmount: 15533.06,
        invoiceType: 'FACTURA_B',
        taxedAmount: 73966.94,
        isWhiteInvoice: true
      },
      {
        customerId: customers[2].id,
        status: 'confirmada',
        saleDate: new Date(), // Hoy
        total: 45200,
        subtotal: 37355.37,
        taxAmount: 7844.63,
        invoiceType: 'FACTURA_A',
        taxedAmount: 37355.37,
        isWhiteInvoice: false
      }
    ]

    // Crear ventas con items
    for (let i = 0; i < salesData.length; i++) {
      const saleData = salesData[i]
      
      // Generar número de venta
      const saleNumber = `V-${(i + 1).toString().padStart(8, '0')}`
      
      const sale = await prisma.sale.create({
        data: {
          ...saleData,
          saleNumber,
          items: {
            create: [
              {
                productId: products[i % products.length].id,
                quantity: 2,
                unitPrice: products[i % products.length].finalPriceArs,
                subtotal: products[i % products.length].finalPriceArs * 2,
                ivaType: products[i % products.length].ivaType,
                ivaAmount: products[i % products.length].finalPriceArs * 2 * 0.21,
                totalAmount: products[i % products.length].finalPriceArs * 2 * 1.21
              }
            ]
          }
        }
      })

      console.log(`✅ Creada venta: ${sale.saleNumber}`)
    }

    // Crear algunos presupuestos de ejemplo
    const quotesData = [
      {
        customerId: customers[0].id,
        status: 'enviado',
        quoteDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Vence en 5 días
        total: 156000,
        subtotal: 128925.62,
        taxAmount: 27074.38
      },
      {
        customerId: customers[1].id,
        status: 'enviado',
        quoteDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Vence en 15 días
        total: 89300,
        subtotal: 73801.65,
        taxAmount: 15498.35
      }
    ]

    for (let i = 0; i < quotesData.length; i++) {
      const quoteData = quotesData[i]
      
      // Generar número de presupuesto
      const quoteNumber = `P-${(i + 1).toString().padStart(8, '0')}`
      
      const quote = await prisma.quote.create({
        data: {
          ...quoteData,
          quoteNumber,
          items: {
            create: [
              {
                productId: products[(i + 2) % products.length].id,
                quantity: 3,
                unitPrice: products[(i + 2) % products.length].finalPriceArs,
                subtotal: products[(i + 2) % products.length].finalPriceArs * 3,
                ivaType: products[(i + 2) % products.length].ivaType,
                ivaAmount: products[(i + 2) % products.length].finalPriceArs * 3 * 0.21,
                totalAmount: products[(i + 2) % products.length].finalPriceArs * 3 * 1.21
              }
            ]
          }
        }
      })

      console.log(`✅ Creado presupuesto: ${quote.quoteNumber}`)
    }

    console.log('✅ Datos de ejemplo creados exitosamente')

  } catch (error) {
    console.error('❌ Error al crear datos de ejemplo:', error)
    throw error
  }
}

async function main() {
  await createSampleData()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 