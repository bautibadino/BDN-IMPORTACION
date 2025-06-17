const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateProductsFiscal() {
  console.log('🔄 Actualizando productos con información fiscal...')

  try {
    // Actualizar productos existentes con valores por defecto
    const updateResult = await prisma.product.updateMany({
      data: {
        ivaType: 'iva_21', // IVA 21% por defecto
        unit: 'unidad', // Unidad por defecto
        minStock: 5 // Stock mínimo por defecto
      }
    })

    console.log(`📦 Actualizados ${updateResult.count} productos`)

    // Crear algunos productos de ejemplo con diferentes tipos de IVA
    const sampleProducts = [
      {
        name: 'Notebook HP 15-DY1001LA',
        internalCode: 'NB-HP-001',
        description: 'Notebook HP Core i5, 8GB RAM, 256GB SSD',
        unit: 'unidad',
        ivaType: 'iva_21',
        finalUnitCostUsd: 400,
        finalUnitCostArs: 400000,
        markupPercentage: 25,
        finalPriceArs: 500000,
        stock: 15,
        minStock: 3,
        location: 'A1-B2'
      },
      {
        name: 'Cable HDMI 2 metros',
        internalCode: 'CAB-HDMI-2M',
        description: 'Cable HDMI alta velocidad 2 metros',
        unit: 'unidad',
        ivaType: 'iva_21',
        finalUnitCostUsd: 8,
        finalUnitCostArs: 8000,
        markupPercentage: 40,
        finalPriceArs: 11200,
        stock: 50,
        minStock: 10,
        location: 'C3-D1'
      },
      {
        name: 'Leche Entera 1L',
        internalCode: 'ALM-LECHE-1L',
        description: 'Leche entera ultrapasteurizada 1 litro',
        unit: 'litro',
        ivaType: 'iva_10_5', // Alimentos básicos 10.5%
        finalUnitCostUsd: 0.8,
        finalUnitCostArs: 800,
        markupPercentage: 30,
        finalPriceArs: 1040,
        stock: 100,
        minStock: 20,
        location: 'FRIO-A1'
      },
      {
        name: 'Libro: "Contabilidad Básica"',
        internalCode: 'LIB-CONT-001',
        description: 'Manual de contabilidad para principiantes',
        unit: 'unidad',
        ivaType: 'exento', // Libros exentos de IVA
        finalUnitCostUsd: 15,
        finalUnitCostArs: 15000,
        markupPercentage: 50,
        finalPriceArs: 22500,
        stock: 25,
        minStock: 5,
        location: 'EST-A3'
      },
      {
        name: 'Servicio de Consultoría IT',
        internalCode: 'SERV-IT-001',
        description: 'Servicio de consultoría en tecnología (por hora)',
        unit: 'hora',
        ivaType: 'iva_21',
        finalUnitCostUsd: 0,
        finalUnitCostArs: 0,
        markupPercentage: 0,
        finalPriceArs: 12000,
        stock: 999, // Stock ilimitado para servicios
        minStock: 0,
        location: 'VIRTUAL'
      }
    ]

    // Crear productos de ejemplo (solo si no existen)
    for (const productData of sampleProducts) {
      const existingProduct = await prisma.product.findFirst({
        where: { internalCode: productData.internalCode }
      })

      if (!existingProduct) {
        // Buscar un proveedor existente o crear uno
        let supplier = await prisma.supplier.findFirst()
        if (!supplier) {
          supplier = await prisma.supplier.create({
            data: {
              name: 'Proveedor de Ejemplo',
              country: 'Argentina',
              contactName: 'Juan Pérez',
              email: 'ejemplo@proveedor.com',
              whatsapp: '+541123456789'
            }
          })
        }

        // Crear ProductLead primero
        const productLead = await prisma.productLead.create({
          data: {
            name: productData.name,
            category: 'ejemplo',
            referencePriceUsd: productData.finalUnitCostUsd,
            supplierId: supplier.id
          }
        })

        await prisma.product.create({
          data: {
            ...productData,
            productLeadId: productLead.id
          }
        })

        console.log(`✅ Creado producto: ${productData.name}`)
      } else {
        console.log(`⏭️  Producto ${productData.name} ya existe`)
      }
    }

    console.log('✅ Actualización fiscal de productos completada')

  } catch (error) {
    console.error('❌ Error al actualizar productos:', error)
    throw error
  }
}

// Función para mostrar estadísticas de productos por tipo de IVA
async function showFiscalStats() {
  console.log('\n📊 Estadísticas fiscales de productos:')
  
  const products = await prisma.product.findMany({
    select: { ivaType: true }
  })

  const stats = {}
  products.forEach(product => {
    stats[product.ivaType] = (stats[product.ivaType] || 0) + 1
  })

  Object.entries(stats).forEach(([ivaType, count]) => {
    console.log(`  ${ivaType}: ${count} productos`)
  })

  console.log(`  Total: ${products.length} productos\n`)
}

async function main() {
  await updateProductsFiscal()
  await showFiscalStats()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 