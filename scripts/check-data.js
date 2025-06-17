const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  console.log('📊 Verificando datos en la base de datos...\n')

  try {
    // Contar registros
    const customerCount = await prisma.customer.count()
    const productCount = await prisma.product.count()
    const saleCount = await prisma.sale.count()
    const quoteCount = await prisma.quote.count()

    console.log('📈 Resumen de datos:')
    console.log(`  Clientes: ${customerCount}`)
    console.log(`  Productos: ${productCount}`)
    console.log(`  Ventas: ${saleCount}`)
    console.log(`  Presupuestos: ${quoteCount}\n`)

    // Mostrar clientes
    if (customerCount > 0) {
      console.log('👥 Clientes:')
      const customers = await prisma.customer.findMany({
        select: {
          id: true,
          businessName: true,
          customerType: true,
          isActive: true
        }
      })
      customers.forEach(customer => {
        console.log(`  - ${customer.businessName} (${customer.customerType}) ${customer.isActive ? '✅' : '❌'}`)
      })
      console.log()
    }

    // Mostrar productos
    if (productCount > 0) {
      console.log('📦 Productos:')
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          ivaType: true,
          finalPriceArs: true,
          stock: true
        },
        take: 5
      })
      products.forEach(product => {
        console.log(`  - ${product.name} (${product.ivaType}) - $${product.finalPriceArs} - Stock: ${product.stock}`)
      })
      if (productCount > 5) {
        console.log(`  ... y ${productCount - 5} más`)
      }
      console.log()
    }

    // Mostrar ventas
    if (saleCount > 0) {
      console.log('💰 Ventas:')
      const sales = await prisma.sale.findMany({
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
      sales.forEach(sale => {
        console.log(`  - ${sale.saleNumber} - ${sale.customer.businessName} - $${sale.total} (${sale.status})`)
      })
      console.log()
    }

    // Mostrar presupuestos
    if (quoteCount > 0) {
      console.log('📋 Presupuestos:')
      const quotes = await prisma.quote.findMany({
        include: {
          customer: {
            select: {
              businessName: true
            }
          }
        },
        orderBy: {
          quoteDate: 'desc'
        },
        take: 5
      })
      quotes.forEach(quote => {
        console.log(`  - ${quote.quoteNumber} - ${quote.customer.businessName} - $${quote.total} (${quote.status})`)
      })
      console.log()
    }

    // Verificar si necesitamos crear datos
    if (saleCount === 0 && quoteCount === 0) {
      console.log('⚠️  No hay ventas ni presupuestos. El dashboard estará vacío.')
      console.log('💡 Sugerencia: Crea algunas ventas desde la interfaz o ejecuta el script de datos de ejemplo.')
    }

  } catch (error) {
    console.error('❌ Error al verificar datos:', error)
  }
}

async function main() {
  await checkData()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 