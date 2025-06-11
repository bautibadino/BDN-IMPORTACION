"use server"

import { revalidatePath } from "next/cache"
import {
  addProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductLeadById,
  getProductByProductLeadId,
  getProducts,
  getProductLeads,
} from "@/lib/store"
import type { ProductFormData, Product } from "@/lib/types"

const USD_TO_ARS_RATE = 1250.0 // Esto debería ser configurable globalmente

// Renombrar a upsertProductFromLeadAction o similar sería más descriptivo
export async function createOrUpdateProductFromLeadAction(formData: ProductFormData & { productLeadId: string }) {
  try {
    const productLead = await getProductLeadById(formData.productLeadId)
    if (!productLead) {
      return { success: false, message: "Product Lead no encontrado." }
    }

    const finalUnitCostArs = formData.finalUnitCostUsd * USD_TO_ARS_RATE
    const finalPriceArs = finalUnitCostArs * (1 + formData.markupPercentage / 100)

    const existingProduct = await getProductByProductLeadId(formData.productLeadId)

    if (existingProduct) {
      // Actualizar producto existente
      const newStock = (existingProduct.stock || 0) + formData.stock // Sumar al stock existente
      const productToUpdate: Partial<Omit<Product, "id" | "productLeadId">> = {
        name: formData.name || productLead.name,
        finalUnitCostUsd: formData.finalUnitCostUsd,
        finalUnitCostArs: finalUnitCostArs,
        markupPercentage: formData.markupPercentage,
        finalPriceArs: finalPriceArs,
        stock: newStock, // Usar el nuevo stock calculado
        mlListingUrl: formData.mlListingUrl,
        location: formData.location,
        internalCode: formData.internalCode || existingProduct.internalCode,
      }
      const updatedProduct = await updateProduct(existingProduct.id, productToUpdate)
      if (!updatedProduct) {
        return { success: false, message: "Error al actualizar el producto existente." }
      }
      revalidatePath("/products")
      revalidatePath("/orders") // Si los productos se muestran en detalles de pedidos
      return {
        success: true,
        message: `Stock de '${updatedProduct.name}' actualizado exitosamente.`,
        product: updatedProduct,
        operation: "updated",
      }
    } else {
      // Crear nuevo producto
      const productToCreate: Omit<Product, "id"> = {
        productLeadId: formData.productLeadId,
        name: formData.name || productLead.name,
        finalUnitCostUsd: formData.finalUnitCostUsd,
        finalUnitCostArs: finalUnitCostArs,
        markupPercentage: formData.markupPercentage,
        finalPriceArs: finalPriceArs,
        stock: formData.stock, // Stock inicial de la recepción
        mlListingUrl: formData.mlListingUrl,
        location: formData.location,
        internalCode: formData.internalCode,
      }
      const newProduct = await addProduct(productToCreate)
      revalidatePath("/products")
      revalidatePath("/orders")
      return {
        success: true,
        message: `Producto '${newProduct.name}' creado y agregado a stock.`,
        product: newProduct,
        operation: "created",
      }
    }
  } catch (error) {
    console.error("Error in createOrUpdateProductFromLeadAction:", error)
    return { success: false, message: "Error al procesar el producto para stock." }
  }
}

export async function getProductsAction() {
  return await getProducts()
}

export async function getProductLeadsAction() {
  return await getProductLeads()
}

// La antigua createProductAction ahora es createOrUpdateProductFromLeadAction
// Mantenemos las otras actions si se usan directamente desde el CRUD de productos.

export async function updateProductAction(id: string, formData: Partial<ProductFormData>) {
  try {
    const productToUpdate: Partial<Omit<Product, "id">> = { ...formData }

    if (formData.finalUnitCostUsd !== undefined || formData.markupPercentage !== undefined) {
      const existingProduct = await getProductById(id)
      if (!existingProduct) return { success: false, message: "Producto no encontrado para recalcular." }

      const finalUnitCostUsd = formData.finalUnitCostUsd ?? existingProduct.finalUnitCostUsd
      const markupPercentage = formData.markupPercentage ?? existingProduct.markupPercentage

      productToUpdate.finalUnitCostUsd = finalUnitCostUsd
      productToUpdate.markupPercentage = markupPercentage
      productToUpdate.finalUnitCostArs = finalUnitCostUsd * USD_TO_ARS_RATE
      productToUpdate.finalPriceArs = productToUpdate.finalUnitCostArs * (1 + markupPercentage / 100)
    }
    // Si se actualiza el stock desde el CRUD de productos, es un reemplazo, no una suma.
    // La suma es específica de la recepción de pedidos.

    const updatedProduct = await updateProduct(id, productToUpdate)
    if (!updatedProduct) {
      return { success: false, message: "Producto no encontrado." }
    }
    revalidatePath("/products")
    return { success: true, message: "Producto actualizado exitosamente.", product: updatedProduct }
  } catch (error) {
    return { success: false, message: "Error al actualizar el producto." }
  }
}

export async function deleteProductAction(id: string) {
  try {
    const success = await deleteProduct(id)
    if (!success) {
      return { success: false, message: "Error al eliminar el producto o producto no encontrado." }
    }
    revalidatePath("/products")
    return { success: true, message: "Producto eliminado exitosamente." }
  } catch (error) {
    return { success: false, message: "Error al eliminar el producto." }
  }
}

export async function getProductAction(id: string): Promise<Product | null> {
  return (await getProductById(id)) || null
}
