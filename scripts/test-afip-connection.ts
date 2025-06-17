/**
 * Script para probar la conexión con AFIP
 * 
 * Uso: npx tsx scripts/test-afip-connection.ts
 */

import { getAfipService } from '../services/afip-service';

async function testAfipConnection() {
  console.log('🔍 Probando conexión con AFIP...\n');

  try {
    const afipService = getAfipService();

    // 1. Verificar estado del servidor
    console.log('1. Verificando estado del servidor AFIP...');
    try {
      const serverStatus = await afipService.checkServerStatus();
      console.log('✅ Servidor AFIP:', serverStatus);
    } catch (error) {
      console.log('❌ Error en servidor AFIP:', error);
    }

    // 2. Obtener tipos de comprobantes
    console.log('\n2. Obteniendo tipos de comprobantes...');
    try {
      const voucherTypes = await afipService.getVoucherTypes();
      console.log('✅ Tipos de comprobantes obtenidos:', voucherTypes.length, 'tipos');
      console.log('   Algunos ejemplos:', voucherTypes.slice(0, 5));
    } catch (error) {
      console.log('❌ Error obteniendo tipos:', error);
    }

    // 3. Probar facturación con una venta existente
    console.log('\n3. Probando facturación con venta existente...');
    
    // Buscar una venta "en blanco" sin facturar
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const saleToInvoice = await prisma.sale.findFirst({
      where: {
        isWhiteInvoice: true,
        authCode: null
      },
      include: {
        customer: true,
        items: true
      }
    });

    if (saleToInvoice) {
      console.log(`📄 Encontrada venta ${saleToInvoice.saleNumber} para facturar`);
      console.log(`   Cliente: ${saleToInvoice.customer.businessName}`);
      console.log(`   Total: $${saleToInvoice.total}`);
      
      try {
        const result = await afipService.generateInvoiceForSale(saleToInvoice.id);
        
        if (result.success) {
          console.log('✅ Facturación exitosa:');
          console.log(`   CAE: ${result.cae}`);
          console.log(`   Vencimiento: ${result.caeExpiry}`);
          console.log(`   Número: ${result.fullNumber}`);
        } else {
          console.log('❌ Error en facturación:', result.error);
          if (result.details) {
            console.log('   Detalles:', result.details);
          }
        }
      } catch (error) {
        console.log('❌ Error en facturación:', error);
      }
    } else {
      console.log('⚠️  No se encontraron ventas "en blanco" sin facturar');
    }

  } catch (error) {
    console.error('❌ Error general en la prueba:', error);
  }

  console.log('\n🏁 Prueba finalizada');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAfipConnection();
} 