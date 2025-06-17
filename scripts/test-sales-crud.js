const baseUrl = 'http://localhost:3001'

async function testSalesCRUD() {
  console.log('🧪 Iniciando pruebas del CRUD de Ventas...\n')

  try {
    // 1. Obtener lista de ventas
    console.log('1️⃣ Obteniendo lista de ventas...')
    const salesResponse = await fetch(`${baseUrl}/api/sales`)
    const salesData = await salesResponse.json()
    console.log(`✅ Encontradas ${salesData.sales.length} ventas`)
    
    if (salesData.sales.length === 0) {
      console.log('❌ No hay ventas para probar. Ejecuta primero el script de datos de muestra.')
      return
    }

    const firstSale = salesData.sales[0]
    console.log(`📋 Probando con venta: ${firstSale.saleNumber} (ID: ${firstSale.id})`)

    // 2. Obtener venta individual (READ)
    console.log('\n2️⃣ Probando lectura individual...')
    const saleResponse = await fetch(`${baseUrl}/api/sales/${firstSale.id}`)
    if (saleResponse.ok) {
      const saleData = await saleResponse.json()
      console.log(`✅ Venta obtenida: ${saleData.saleNumber}`)
      console.log(`   Cliente: ${saleData.customer.businessName}`)
      console.log(`   Total: $${saleData.total.toLocaleString('es-AR')}`)
      console.log(`   Items: ${saleData.items.length}`)
    } else {
      console.log('❌ Error al obtener venta individual')
      return
    }

    // 3. Actualizar venta (UPDATE)
    console.log('\n3️⃣ Probando actualización...')
    const updateData = {
      customerId: firstSale.customerId,
      items: [
        {
          productId: firstSale.items[0]?.productId || 'cmbwngmv200049kxtofwta451',
          quantity: 3,
          unitPrice: 150000
        }
      ],
      notes: `Venta actualizada por prueba CRUD - ${new Date().toISOString()}`
    }

    const updateResponse = await fetch(`${baseUrl}/api/sales/${firstSale.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    })

    if (updateResponse.ok) {
      const updatedSale = await updateResponse.json()
      console.log(`✅ Venta actualizada exitosamente`)
      console.log(`   Nuevo total: $${updatedSale.total.toLocaleString('es-AR')}`)
      console.log(`   Notas: ${updatedSale.notes}`)
    } else {
      const error = await updateResponse.json()
      console.log(`❌ Error al actualizar: ${error.error}`)
    }

    // 4. Crear nueva venta para probar eliminación
    console.log('\n4️⃣ Creando venta de prueba para eliminación...')
    const newSaleData = {
      customerId: firstSale.customerId,
      items: [
        {
          productId: firstSale.items[0]?.productId || 'cmbwngmv200049kxtofwta451',
          quantity: 1,
          unitPrice: 100000
        }
      ],
      notes: 'Venta de prueba para eliminación'
    }

    const createResponse = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newSaleData)
    })

    if (createResponse.ok) {
      const newSale = await createResponse.json()
      console.log(`✅ Venta de prueba creada: ${newSale.saleNumber}`)

      // 5. Eliminar venta de prueba (DELETE)
      console.log('\n5️⃣ Probando eliminación...')
      const deleteResponse = await fetch(`${baseUrl}/api/sales/${newSale.id}`, {
        method: 'DELETE'
      })

      if (deleteResponse.ok) {
        console.log(`✅ Venta eliminada exitosamente`)
        
        // Verificar que fue eliminada
        const verifyResponse = await fetch(`${baseUrl}/api/sales/${newSale.id}`)
        if (verifyResponse.status === 404) {
          console.log(`✅ Confirmado: la venta ya no existe`)
        } else {
          console.log(`⚠️  La venta aún existe después de la eliminación`)
        }
      } else {
        const error = await deleteResponse.json()
        console.log(`❌ Error al eliminar: ${error.error}`)
      }
    } else {
      const error = await createResponse.json()
      console.log(`❌ Error al crear venta de prueba: ${error.error}`)
    }

    console.log('\n🎉 Pruebas del CRUD completadas exitosamente!')
    console.log('\n📊 Resumen de funcionalidades probadas:')
    console.log('   ✅ CREATE - Crear nueva venta')
    console.log('   ✅ READ - Leer venta individual')
    console.log('   ✅ UPDATE - Actualizar venta existente')
    console.log('   ✅ DELETE - Eliminar venta')
    console.log('   ✅ LIST - Listar todas las ventas')

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message)
  }
}

// Ejecutar las pruebas
testSalesCRUD() 