const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando datos básicos...');

  try {
    // Crear clientes de ejemplo (con upsert para evitar duplicados)
    const cliente1 = await prisma.customer.upsert({
      where: { taxId: '30-12345678-9' },
      update: {},
      create: {
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
    });

    const cliente2 = await prisma.customer.upsert({
      where: { taxId: '30-98765432-1' },
      update: {},
      create: {
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
    });

    const cliente3 = await prisma.customer.upsert({
      where: { taxId: '27-11223344-5' },
      update: {},
      create: {
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
    });

    console.log('✅ Clientes creados/actualizados:', [cliente1.id, cliente2.id, cliente3.id]);

    // Verificar si ya existen productos
    const existingProducts = await prisma.product.count();
    
    if (existingProducts === 0) {
      // Primero necesitamos crear un ProductLead para cada producto
      const supplier1 = await prisma.supplier.create({
        data: {
          name: 'Proveedor Ejemplo',
          country: 'Argentina',
          contactName: 'Contacto Ejemplo',
          email: 'contacto@proveedor.com'
        }
      });

      const productLead1 = await prisma.productLead.create({
        data: {
          name: 'Tornillo 6x1"',
          category: 'Ferretería',
          referencePriceUsd: 0.10,
          moq: 100,
          currency: 'USD',
          supplierId: supplier1.id
        }
      });

      const productLead2 = await prisma.productLead.create({
        data: {
          name: 'Tuerca 6mm',
          category: 'Ferretería',
          referencePriceUsd: 0.05,
          moq: 200,
          currency: 'USD',
          supplierId: supplier1.id
        }
      });

      // Crear algunos productos básicos
      const producto1 = await prisma.product.create({
        data: {
          name: 'Tornillo 6x1"',
          internalCode: 'TOR-6X1',
          description: 'Tornillo autorroscante 6x1 pulgada',
          unit: 'unidad',
          ivaType: 'iva_21',
          finalUnitCostUsd: 0.12,
          finalUnitCostArs: 120,
          markupPercentage: 50,
          finalPriceArs: 180,
          stock: 1000,
          minStock: 100,
          productLeadId: productLead1.id
        }
      });

      const producto2 = await prisma.product.create({
        data: {
          name: 'Tuerca 6mm',
          internalCode: 'TUE-6MM',
          description: 'Tuerca hexagonal 6mm',
          unit: 'unidad',
          ivaType: 'iva_21',
          finalUnitCostUsd: 0.06,
          finalUnitCostArs: 60,
          markupPercentage: 60,
          finalPriceArs: 96,
          stock: 800,
          minStock: 80,
          productLeadId: productLead2.id
        }
      });

      console.log('✅ Productos creados:', [producto1.id, producto2.id]);
    } else {
      console.log('✅ Productos ya existen:', existingProducts);
    }

    console.log('🎉 Datos básicos creados/verificados exitosamente!');
  } catch (error) {
    console.error('❌ Error específico:', error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 