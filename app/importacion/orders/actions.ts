"use server"

import { revalidatePath } from "next/cache"
import {
  addOrder,
  addOrderItem,
  addImportCost,
  addDocument,
  updateOrder,
  getOrders,
  getProductLeadsWithDetails,
  getOrderById,
  getOrderItemsByOrderId,
  getOrderItemsWithProductsByOrderId,
  getImportCostsByOrderId,
  getProductLeads,
  addProduct,
  getProductByProductLeadId,
  updateProduct,
  addProductBatch,
  calculateAverageProductCost,
} from "@/lib/store"
import type { OrderFormData, OrderItemFormData, ImportCostFormData, DocumentFormData } from "@/lib/types"
import type { Product } from "@prisma/client"
import type { Order } from "@prisma/client" // Importar desde prisma client
import { calculateOrderCosts, type OrderItemWithProduct } from "@/lib/costs"

// Definimos un tipo para los items que vendrán del formulario
interface OrderItemInput extends Omit<OrderItemFormData, "orderId"> {}

export async function saveOrderAction(id: string | null, orderData: OrderFormData, itemsData: OrderItemInput[]) {
  console.log("Action: saveOrderAction triggered.")
  console.log("Action: Received orderData (original):", JSON.stringify(orderData, null, 2))
  console.log("Action: Received itemsData:", JSON.stringify(itemsData, null, 2))

  const processedOrderData = { ...orderData }

  // Convertir orderDate
  if (orderData.orderDate && typeof orderData.orderDate === "string") {
    const [year, month, day] = orderData.orderDate.split("-").map(Number)
    processedOrderData.orderDate = new Date(year, month - 1, day).toISOString() // Enviar como ISO string
  } else {
    // Si es inválido o no existe, podrías asignar new Date() o manejar el error
    // Por ahora, si es inválido, Prisma fallará, lo cual está bien para la validación.
    // Si es requerido, el schema Zod debería haberlo atrapado.
  }

  // Convertir estimatedArrival
  if (orderData.estimatedArrival && typeof orderData.estimatedArrival === "string") {
    const [year, month, day] = orderData.estimatedArrival.split("-").map(Number)
    processedOrderData.estimatedArrival = new Date(year, month - 1, day).toISOString() // Enviar como ISO string
  } else {
    processedOrderData.estimatedArrival = null // Si está vacío o no es una cadena, enviar null
  }

  console.log("Action: Processed orderData:", JSON.stringify(processedOrderData, null, 2))

  try {
    if (id) {
      // La lógica de actualización de items no está implementada, solo actualiza el pedido.
      const updatedOrder = await updateOrder(id, processedOrderData) // Usar processedOrderData
      if (!updatedOrder) {
        return { success: false, message: "Pedido no encontrado para actualizar." }
      }
      revalidatePath("/orders")
      revalidatePath(`/orders/${id}`)
      return { success: true, message: "Pedido actualizado exitosamente.", order: updatedOrder }
    }

    // Crear el Pedido y sus Items en una transacción
    const newOrder = await addOrder(processedOrderData, itemsData) // Usar processedOrderData
    if (!newOrder) {
      return { success: false, message: "Error al crear el pedido." }
    }

    revalidatePath("/orders")
    revalidatePath(`/orders/${newOrder.id}`)
    return { success: true, message: "Pedido creado exitosamente con sus items.", order: newOrder }
  } catch (error) {
    console.error("Action: Error in saveOrderAction:", error)
    let errorMessage = "Error en la operación del pedido."
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return {
      success: false,
      message: errorMessage,
      errorDetails: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    }
  }
}

// ... (resto de las funciones sin cambios)
export async function updateOrderStatusAction(orderId: string, newStatus: Order["status"]) {
  try {
    const updatedOrder = await updateOrder(orderId, { status: newStatus })
    if (!updatedOrder) {
      return { success: false, message: "Pedido no encontrado." }
    }
    revalidatePath("/orders")
    revalidatePath(`/orders/${orderId}`)
    return { success: true, message: `Estado del pedido actualizado a ${newStatus}.`, order: updatedOrder }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { success: false, message: "Error al actualizar el estado del pedido." }
  }
}

export async function getOrdersAction() {
  return await getOrders()
}

export async function getProductLeadsWithDetailsAction() {
  return await getProductLeadsWithDetails()
}

export async function getOrderByIdAction(id: string) {
  return await getOrderById(id)
}

export async function getOrderItemsByOrderIdAction(orderId: string) {
  return await getOrderItemsByOrderId(orderId)
}

export async function getProductLeadsAction() {
  return await getProductLeads()
}

// --- OrderItem Actions ---
export async function addOrderItemAction(formData: OrderItemFormData) {
  try {
    const newItem = await addOrderItem(formData)
    revalidatePath(`/orders/${formData.orderId}`)
    return { success: true, message: "Item añadido al pedido.", item: newItem }
  } catch (error) {
    return { success: false, message: "Error al añadir item." }
  }
}

// --- ImportCost Actions ---
export async function addImportCostAction(formData: ImportCostFormData) {
  try {
    const newCost = await addImportCost(formData)
    revalidatePath(`/orders/${formData.orderId}`)
    return { success: true, message: "Costo de importación añadido.", cost: newCost }
  } catch (error) {
    return { success: false, message: "Error al añadir costo." }
  }
}

// --- Document Actions ---
export async function addDocumentAction(formData: DocumentFormData) {
  try {
    if (!formData.fileUrl) {
      return { success: false, message: "URL del archivo es requerida." }
    }
    const newDocument = await addDocument(formData)
    revalidatePath(`/orders/${formData.orderId}`)
    return { success: true, message: "Documento añadido.", document: newDocument }
  } catch (error) {
    return { success: false, message: "Error al añadir documento." }
  }
}

// --- Costs Calculation Actions ---
export async function getOrderCostBreakdownAction(orderId: string) {
  try {
    const orderItems = await getOrderItemsWithProductsByOrderId(orderId) as OrderItemWithProduct[]
    const importCosts = await getImportCostsByOrderId(orderId)
    
    const costCalculation = calculateOrderCosts(orderItems, importCosts)
    return { success: true, data: costCalculation }
  } catch (error) {
    console.error("Error calculating order costs:", error)
    return { success: false, message: "Error al calcular los costos de la orden." }
  }
}

// --- Order Finalization Actions ---
export async function finalizeOrderAction(orderId: string) {
  try {
    console.log("Starting finalizeOrderAction for order:", orderId)
    
    // Obtener la orden
    const order = await getOrderById(orderId)
    if (!order) {
      return { success: false, message: "Orden no encontrada." }
    }

    console.log("Order found:", order.orderNumber, "status:", order.status)

    // Solo procesar si el estado es "recibido"
    if (order.status !== "recibido") {
      return { success: false, message: "La orden debe estar en estado 'recibido' para finalizar." }
    }

    // Verificar si ya fue procesada a stock
    if ((order as any).isProcessedToStock) {
      return { 
        success: false, 
        message: "Esta orden ya fue procesada a stock anteriormente.",
        alreadyProcessed: true
      }
    }

    // Obtener items y costos
    const orderItems = await getOrderItemsWithProductsByOrderId(orderId) as OrderItemWithProduct[]
    const importCosts = await getImportCostsByOrderId(orderId)
    
    if (orderItems.length === 0) {
      return { success: false, message: "La orden no tiene items para procesar." }
    }

    // Calcular costos
    const costCalculation = calculateOrderCosts(orderItems, importCosts)
    
    // Obtener el tipo de cambio actual desde configuración  
    const { getUsdToArsRate, DEFAULT_MARKUP_PERCENTAGE } = await import("@/lib/settings")
    const USD_TO_ARS_RATE = getUsdToArsRate()

    // Crear o actualizar productos con sistema de lotes
    const processedProducts = []
    const processedBatches = []
    
    for (const item of costCalculation.items) {
      const productLead = orderItems.find(oi => oi.productLeadId === item.productLeadId)
      if (!productLead) continue

      // Buscar si ya existe un producto para este ProductLead
      let existingProduct = await getProductByProductLeadId(item.productLeadId)
      
      const finalUnitCostArs = item.finalUnitCostUsd * USD_TO_ARS_RATE
      const markupPercentage = DEFAULT_MARKUP_PERCENTAGE
      const finalPriceArs = finalUnitCostArs * (1 + markupPercentage / 100)

      if (!existingProduct) {
        // Crear nuevo producto si no existe
        const newProduct = {
          productLeadId: item.productLeadId,
          name: item.productName,
          internalCode: null,
          finalUnitCostUsd: item.finalUnitCostUsd, // Será recalculado después
          finalUnitCostArs,
          markupPercentage,
          finalPriceArs,
          stock: 0, // Se actualizará con la suma de lotes
          location: null,
          images: null
        }
        existingProduct = await addProduct(newProduct)
        processedProducts.push({ ...existingProduct, operation: "created" })
      }

      // Crear el lote individual para este producto
      const batchNumber = `${order.orderNumber}-${item.productLeadId.slice(-4)}`
      console.log("Creating batch:", batchNumber, "for product:", existingProduct.id)
      const newBatch = await addProductBatch({
        batchNumber,
        quantity: item.quantity,
        unitCostUsd: item.finalUnitCostUsd,
        totalCostUsd: item.totalFinalCostUsd,
        location: null,
        notes: `Importación orden ${order.orderNumber}`,
        productId: existingProduct.id,
        orderId: order.id,
        productLeadId: item.productLeadId
      })
      console.log("Batch created:", newBatch)
      processedBatches.push(newBatch)

      // Calcular el nuevo costo promedio y stock total
      const newAverageCost = await calculateAverageProductCost(existingProduct.id)
      const newStock = existingProduct.stock + item.quantity
      const newFinalUnitCostArs = newAverageCost * USD_TO_ARS_RATE
      const newFinalPriceArs = newFinalUnitCostArs * (1 + markupPercentage / 100)

      // Actualizar el producto con los nuevos valores calculados
      const updatedProduct = await updateProduct(existingProduct.id, {
        finalUnitCostUsd: newAverageCost,
        finalUnitCostArs: newFinalUnitCostArs,
        finalPriceArs: newFinalPriceArs,
        stock: newStock
      })
      
      if (!processedProducts.find(p => p.id === existingProduct.id)) {
        processedProducts.push({ ...updatedProduct, operation: "updated" })
      }
    }

    // Marcar la orden como procesada
    await updateOrder(orderId, {
      isProcessedToStock: true,
      processedAt: new Date().toISOString()
    } as any)

    revalidatePath("/orders")
    revalidatePath(`/orders/${orderId}`)
    revalidatePath("/products")

    return { 
      success: true, 
      message: `Orden finalizada. ${processedProducts.length} productos y ${processedBatches.length} lotes procesados.`,
      processedProducts,
      processedBatches,
      costCalculation
    }
  } catch (error) {
    console.error("Error finalizing order:", error)
    return { success: false, message: "Error al finalizar la orden." }
  }
}
