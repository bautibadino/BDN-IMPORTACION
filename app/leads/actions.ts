"use server"

import { revalidatePath } from "next/cache"
import { addProductLead, updateProductLead, addProductLeadStatus, getProductLeads, getSuppliers } from "@/lib/store"
import type { ProductLeadFormData, ProductLead, ProductLeadStatusFormData } from "@/lib/types"

export async function getProductLeadsAction() {
  return await getProductLeads()
}

export async function getSuppliersAction() {
  return await getSuppliers()
}

export async function saveProductLeadAction(id: string | null, formData: ProductLeadFormData) {
  try {
    let savedLead: ProductLead | null = null
    const dataToSave = { ...formData, createdAt: formData.createdAt || new Date().toISOString() }

    if (id) {
      savedLead = await updateProductLead(id, dataToSave)
    } else {
      savedLead = await addProductLead(dataToSave)
    }

    if (!savedLead) {
      return { success: false, message: id ? "Lead no encontrado." : "Error al crear lead." }
    }
    revalidatePath("/leads")
    if (id) revalidatePath(`/leads/${id}`)
    return { success: true, message: `Lead ${id ? "actualizado" : "creado"} exitosamente.`, lead: savedLead }
  } catch (error) {
    return { success: false, message: "Error en la operación del lead." }
  }
}

export async function addProductLeadStatusAction(formData: ProductLeadStatusFormData) {
  try {
    const newStatus = await addProductLeadStatus(formData)
    revalidatePath(`/leads/${formData.productLeadId}`)
    return { success: true, message: "Estado añadido exitosamente.", status: newStatus }
  } catch (error) {
    return { success: false, message: "Error al añadir el estado." }
  }
}

// TODO: deleteProductLeadAction
