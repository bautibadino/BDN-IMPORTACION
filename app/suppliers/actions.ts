"use server"

import { revalidatePath } from "next/cache"
import { addSupplier, updateSupplier, deleteSupplier, addSupplierNote, getSuppliers } from "@/lib/store"
import type { SupplierFormData, Supplier, SupplierNoteFormData } from "@/lib/types"

export async function getSuppliersAction() {
  console.log("ACTION: getSuppliersAction called")
  try {
    const suppliers = await getSuppliers()
    console.log("ACTION: getSuppliersAction success, count:", suppliers.length)
    return suppliers
  } catch (error) {
    console.error("ACTION: Error in getSuppliersAction:", error)
    throw error // Re-throw para que el error se propague si es necesario
  }
}

export async function saveSupplierAction(id: string | null, formData: SupplierFormData) {
  console.log("ACTION: saveSupplierAction called")
  console.log("ACTION: ID:", id)
  console.log("ACTION: Original FormData:", JSON.stringify(formData, null, 2))

  // Convertir firstContact a Date si existe y es una cadena válida
  const processedFormData = { ...formData }
  if (formData.firstContact && typeof formData.firstContact === "string") {
    const dateObject = new Date(formData.firstContact)
    // Verificar si la fecha es válida. Si el string no es un formato de fecha válido,
    // new Date() puede devolver "Invalid Date".
    // También, el input date a veces envía la fecha en UTC, así que ajustamos.
    if (!isNaN(dateObject.getTime())) {
      // El input date devuelve YYYY-MM-DD, que new Date() interpreta como UTC.
      // Para asegurar que se guarde la fecha local correcta, podemos ajustar la zona horaria.
      // O, más simple, si el día es lo único que importa, YYYY-MM-DD es suficiente para que Prisma lo convierta.
      // Prisma debería poder manejar "YYYY-MM-DD" y convertirlo a DateTime a medianoche UTC.
      // Sin embargo, para ser explícitos y evitar problemas de zona horaria, es mejor convertirlo a un objeto Date.
      // new Date("YYYY-MM-DD") crea una fecha a medianoche UTC.
      // Si quieres que sea medianoche en la zona horaria local del servidor:
      const [year, month, day] = formData.firstContact.split("-").map(Number)
      processedFormData.firstContact = new Date(year, month - 1, day)
    } else {
      // Si la fecha no es válida, la ponemos como null para evitar errores de Prisma,
      // o podrías devolver un error aquí.
      console.warn("ACTION: Invalid date string received for firstContact:", formData.firstContact)
      processedFormData.firstContact = null
    }
  } else if (formData.firstContact === "") {
    // Si es una cadena vacía, trátala como null
    processedFormData.firstContact = null
  }

  console.log("ACTION: Processed FormData:", JSON.stringify(processedFormData, null, 2))

  try {
    let savedSupplier: Supplier | null = null
    if (id) {
      console.log("ACTION: Attempting to update supplier with ID:", id)
      // Asegúrate de pasar processedFormData aquí
      savedSupplier = await updateSupplier(id, processedFormData)
      console.log("ACTION: updateSupplier result:", savedSupplier)
    } else {
      console.log("ACTION: Attempting to add new supplier")
      // Asegúrate de pasar processedFormData aquí
      savedSupplier = await addSupplier(processedFormData)
      console.log("ACTION: addSupplier result:", savedSupplier)
    }

    if (!savedSupplier) {
      console.error("ACTION: Failed to save supplier. savedSupplier is null.")
      return { success: false, message: id ? "Proveedor no encontrado." : "Error al crear proveedor." }
    }

    console.log("ACTION: Supplier saved successfully. Revalidating paths...")
    revalidatePath("/suppliers")
    if (id) revalidatePath(`/suppliers/${id}`)

    console.log("ACTION: Returning success response.")
    return {
      success: true,
      message: `Proveedor ${id ? "actualizado" : "creado"} exitosamente.`,
      supplier: savedSupplier,
    }
  } catch (error) {
    console.error("ACTION: Error in saveSupplierAction:", error)
    // Asegúrate de que el error se propague o se maneje adecuadamente
    // Dependiendo de la naturaleza del error, podrías querer devolver un mensaje más específico.
    let errorMessage = "Error en la operación del proveedor."
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return { success: false, message: errorMessage, error: JSON.stringify(error, Object.getOwnPropertyNames(error)) }
  }
}

export async function deleteSupplierAction(id: string) {
  console.log("ACTION: deleteSupplierAction called for ID:", id)
  try {
    const success = await deleteSupplier(id) // deleteSupplier en lib/store debería devolver el proveedor eliminado o lanzar error
    if (!success) {
      // Asumiendo que deleteSupplier devuelve el objeto o null/error
      console.error("ACTION: Failed to delete supplier or supplier not found, ID:", id)
      return { success: false, message: "Error al eliminar el proveedor o proveedor no encontrado." }
    }
    console.log("ACTION: Supplier deleted successfully. Revalidating path /suppliers.")
    revalidatePath("/suppliers")
    return { success: true, message: "Proveedor eliminado exitosamente." }
  } catch (error) {
    console.error("ACTION: Error in deleteSupplierAction:", error)
    let errorMessage = "Error al eliminar el proveedor."
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return { success: false, message: errorMessage, error: JSON.stringify(error, Object.getOwnPropertyNames(error)) }
  }
}

export async function addSupplierNoteAction(formData: SupplierNoteFormData) {
  console.log("ACTION: addSupplierNoteAction called for supplier ID:", formData.supplierId)
  console.log("ACTION: Note FormData:", JSON.stringify(formData, null, 2))
  try {
    const newNote = await addSupplierNote(formData)
    console.log("ACTION: Note added successfully:", newNote)
    revalidatePath(`/suppliers/${formData.supplierId}`) // Revalida la página de detalle del proveedor
    return { success: true, message: "Nota añadida exitosamente.", note: newNote }
  } catch (error) {
    console.error("ACTION: Error in addSupplierNoteAction:", error)
    let errorMessage = "Error al añadir la nota."
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return { success: false, message: errorMessage, error: JSON.stringify(error, Object.getOwnPropertyNames(error)) }
  }
}
