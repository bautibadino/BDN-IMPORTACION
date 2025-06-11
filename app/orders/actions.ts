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
  getProductLeads,
} from "@/lib/store"
import type { OrderFormData, OrderItemFormData, ImportCostFormData, DocumentFormData } from "@/lib/types"
import type { Order } from "@prisma/client" // Importar desde prisma client

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
