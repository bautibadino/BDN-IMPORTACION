import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creando datos de ejemplo para ventas...')

  // Crear clientes de ejemplo
  const cliente1 = await prisma.customer.create({
    data: {
      businessName: 'Ferretería San Martín',
      taxId: '30-12345678-9',
      customerType: 'responsable_inscripto',
      contactName: 'Juan Pérez',
      email: 'juan@ferreteriasmmartin.com',
      phone: '011-4567-8900',
      whatsapp: '011-4567-8900',
      address: 'Av. San Martín 1234',
      city: 'Buenos Aires',
      province: 'CABA',
      postalCode: '1234',
      creditLimit: 50000,
      paymentTerms: 30,
      discount: 5,
      isActive: true
    }
  })

  const cliente2 = await prisma.customer.create({
    data: {
      businessName: 'Distribuidora Norte',
      taxId: '30-98765432-1',
      customerType: 'responsable_inscripto',
      contactName: 'María González',
      email: 'maria@distrinorte.com',
      phone: '011-9876-5432',
      address: 'Belgrano 567',
      city: 'Rosario',
      province: 'Santa Fe',
      postalCode: '2000',
      creditLimit: 100000,
      paymentTerms: 60,
      discount: 10,
      isActive: true
    }
  })

  const cliente3 = await prisma.customer.create({
    data: {
      businessName: 'Comercial del Sur',
      taxId: '27-11223344-5',
      customerType: 'monotributo',
      contactName: 'Carlos López',
      email: 'carlos@comsur.com',
      phone: '0351-123-4567',
      address: 'Rivadavia 890',
      city: 'Córdoba',
      province: 'Córdoba',
      postalCode: '5000',
      creditLimit: 25000,
      paymentTerms: 15,
      discount: 3,
      isActive: true
    }
  })

  console.log('✅ Clientes creados')

  // Obtener algunos productos existentes
  const productos = await prisma.product.findMany({
    take: 5
  })

  if (productos.length === 0) {
    console.log('⚠️ No hay productos en la base de datos. Crear productos primero.')
    return
  }

  // Crear ventas de ejemplo
  const venta1 = await prisma.sale.create({
    data: {
      saleNumber: 'V-00000001',
      customerId: cliente1.id,
      status: 'pagada',
      saleDate: new Date('2024-01-15'),
      subtotal: 12450,
      taxAmount: 2614.50,
      discountAmount: 622.50,
      total: 14442,
      notes: 'Entrega urgente',
      items: {
        create: productos.slice(0, 2).map((producto, index) => ({
          productId: producto.id,
          quantity: index + 1,
          unitPrice: producto.finalPriceArs,
          discount: 5,
          subtotal: (index + 1) * producto.finalPriceArs * 0.95,
          description: `Ítem ${index + 1}`
        }))
      }
    }
  })

  const venta2 = await prisma.sale.create({
    data: {
      saleNumber: 'V-00000002',
      customerId: cliente2.id,
      status: 'facturada',
      saleDate: new Date('2024-01-20'),
      subtotal: 8900,
      taxAmount: 1869,
      discountAmount: 890,
      total: 9879,
      notes: 'Cliente preferencial',
      items: {
        create: productos.slice(2, 4).map((producto, index) => ({
          productId: producto.id,
          quantity: 2,
          unitPrice: producto.finalPriceArs,
          discount: 10,
          subtotal: 2 * producto.finalPriceArs * 0.90,
          description: `Producto ${index + 1}`
        }))
      }
    }
  })

  const venta3 = await prisma.sale.create({
    data: {
      saleNumber: 'V-00000003',
      customerId: cliente3.id,
      status: 'confirmada',
      saleDate: new Date('2024-01-25'),
      subtotal: 15200,
      taxAmount: 3192,
      discountAmount: 456,
      total: 17936,
      notes: 'Pendiente de entrega',
      items: {
        create: [
          {
            productId: productos[0].id,
            quantity: 3,
            unitPrice: productos[0].finalPriceArs,
            discount: 3,
            subtotal: 3 * productos[0].finalPriceArs * 0.97,
            description: 'Producto principal'
          }
        ]
      }
    }
  })

  console.log('✅ Ventas creadas')

  // Crear algunos presupuestos
  const presupuesto1 = await prisma.quote.create({
    data: {
      quoteNumber: 'P-00000001',
      customerId: cliente1.id,
      status: 'enviado',
      quoteDate: new Date('2024-01-28'),
      validUntil: new Date('2024-02-28'),
      subtotal: 24800,
      taxAmount: 5208,
      discountAmount: 1240,
      total: 28768,
      notes: 'Presupuesto para obra nueva',
      terms: 'Válido por 30 días. Precios sujetos a cambio.',
      items: {
        create: productos.slice(0, 3).map((producto, index) => ({
          productId: producto.id,
          quantity: index + 2,
          unitPrice: producto.finalPriceArs,
          discount: 5,
          subtotal: (index + 2) * producto.finalPriceArs * 0.95,
          description: `Item presupuesto ${index + 1}`
        }))
      }
    }
  })

  console.log('✅ Presupuestos creados')

  // Crear algunas transacciones de cuenta corriente
  await prisma.currentAccountItem.createMany({
    data: [
      {
        customerId: cliente1.id,
        date: new Date('2024-01-15'),
        type: 'debe',
        concept: 'factura',
        reference: 'V-00000001',
        amount: 14442,
        balance: 14442,
        notes: 'Factura de venta'
      },
      {
        customerId: cliente1.id,
        date: new Date('2024-01-16'),
        type: 'haber',
        concept: 'pago',
        reference: 'PAG-001',
        amount: 14442,
        balance: 0,
        notes: 'Pago transferencia bancaria'
      },
      {
        customerId: cliente2.id,
        date: new Date('2024-01-20'),
        type: 'debe',
        concept: 'factura',
        reference: 'V-00000002',
        amount: 9879,
        balance: 9879,
        notes: 'Factura pendiente'
      }
    ]
  })

  console.log('✅ Cuenta corriente inicializada')

  console.log('🎉 Datos de ejemplo creados exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 