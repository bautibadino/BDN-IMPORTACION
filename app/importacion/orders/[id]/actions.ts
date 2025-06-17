"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"

export async function markOrderAsProcessedAction(orderId: string) {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        isProcessedToStock: true, 
        processedAt: new Date() 
      }
    })

    revalidatePath(`/importacion/orders/${orderId}`)
    revalidatePath("/importacion/orders")

    return { 
      success: true, 
      message: "Orden marcada como procesada exitosamente",
      order: updatedOrder 
    }
  } catch (error) {
    console.error("Error marking order as processed:", error)
    return { 
      success: false, 
      message: "Error al marcar la orden como procesada" 
    }
  }
} 