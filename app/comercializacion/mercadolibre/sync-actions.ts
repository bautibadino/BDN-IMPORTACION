"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { 
  getValidToken,
} from "./actions"
import {
  searchCategories,
  getCategoryDetails,
  getCategoryAttributes,
  createItem,
  updateItem,
  getItem
} from "@/lib/mercadolibre"
import type { ProductWithImages } from "@/lib/types"

// Interfaz para atributos de MercadoLibre
interface MLAttribute {
  id: string
  name: string
  type: string
  required: boolean
  value_type: string
  values?: Array<{
    id: string
    name: string
  }>
}

// Interfaz para configuración de atributos del producto
interface ProductAttributeConfig {
  [attributeId: string]: string
}

/**
 * Busca categorías de MercadoLibre por nombre de producto
 */
export async function searchMercadoLibreCategoriesAction(productName: string) {
  try {
    console.log('🔍 Iniciando búsqueda de categorías para:', productName)
    
    const token = await getValidToken()
    if (!token) {
      console.log('❌ No hay token válido')
      return { success: false, message: 'No hay conexión con MercadoLibre' }
    }

    console.log('✅ Token válido obtenido')
    const categories = await searchCategories(token, productName)
    console.log('📋 Categorías encontradas:', categories.length)
    console.log('📋 Categorías:', categories)
    
    if (!categories || categories.length === 0) {
      return {
        success: true,
        categories: [],
        message: 'No se encontraron categorías para este término de búsqueda'
      }
    }
    
    return {
      success: true,
      categories: categories.slice(0, 10), // Limitar a 10 resultados
      message: `Se encontraron ${categories.length} categorías`
    }
  } catch (error) {
    console.error('❌ Error searching categories:', error)
    return {
      success: false,
      message: 'Error buscando categorías: ' + (error instanceof Error ? error.message : 'Unknown error'),
      categories: []
    }
  }
}

/**
 * Obtiene detalles y atributos de una categoría específica
 */
export async function getCategoryDetailsAction(categoryId: string) {
  try {
    const token = await getValidToken()
    if (!token) {
      return { success: false, message: 'No hay conexión con MercadoLibre' }
    }

    const [details, attributes] = await Promise.all([
      getCategoryDetails(token, categoryId),
      getCategoryAttributes(token, categoryId)
    ])
    
    return {
      success: true,
      details,
      attributes
    }
  } catch (error) {
    console.error('Error getting category details:', error)
    return {
      success: false,
      message: 'Error obteniendo detalles de categoría: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

/**
 * Guarda la categoría seleccionada para un producto
 */
export async function saveProductCategoryAction(productId: string, categoryId: string) {
  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        mlCategoryId: categoryId,
        mlSyncEnabled: true
      } as any
    })

    revalidatePath(`/comercializacion/productos/${productId}`)
    
    return {
      success: true,
      message: 'Categoría guardada exitosamente',
      product: updatedProduct
    }
  } catch (error) {
    console.error('Error saving category:', error)
    return {
      success: false,
      message: 'Error guardando categoría: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

/**
 * Obtiene los atributos requeridos de una categoría y construye valores por defecto
 */
async function buildDynamicAttributes(token: string, categoryId: string, product: any): Promise<any[]> {
  try {
    console.log('🔍 Obteniendo atributos para categoría:', categoryId)
    
    // Verificar si hay atributos guardados por el usuario
    let userAttributes: Record<string, string> = {}
    if (product.mlSyncErrors?.startsWith('ATTRIBUTES:')) {
      try {
        const attributesJson = product.mlSyncErrors.replace('ATTRIBUTES:', '')
        userAttributes = JSON.parse(attributesJson)
        console.log('📝 Usando atributos definidos por el usuario:', userAttributes)
      } catch (error) {
        console.log('⚠️ Error parsing user attributes, usando valores por defecto')
      }
    }
    
    const categoryAttributes = await getCategoryAttributes(token, categoryId)
    console.log('📋 Atributos disponibles:', categoryAttributes.length)
    
    const attributes: any[] = []
    
    // Filtrar solo los atributos requeridos
    const requiredAttributes = categoryAttributes.filter((attr: MLAttribute) => attr.required)
    console.log('⚠️ Atributos requeridos:', requiredAttributes.map((attr: MLAttribute) => `${attr.id} (${attr.name})`))
    
    // Construir atributos con valores inteligentes
    for (const attr of requiredAttributes) {
      let value = ''
      
      // Usar valor del usuario si está disponible
      if (userAttributes[attr.id]) {
        value = userAttributes[attr.id]
        console.log(`✅ Usando valor del usuario para ${attr.id}: ${value}`)
      } else {
        // Usar lógica automática como fallback
        switch (attr.id) {
          case 'BRAND':
            value = product.name.toLowerCase().includes('apple') ? 'Apple' : 
                   product.name.toLowerCase().includes('samsung') ? 'Samsung' :
                   product.name.toLowerCase().includes('xiaomi') ? 'Xiaomi' :
                   'Genérico'
            break
          case 'MODEL':
            value = product.internalCode || product.name.slice(0, 30) || 'Modelo estándar'
            break
          case 'CONECTOR_SALIDA':
          case 'OUTPUT_CONNECTOR':
            if (product.name.toLowerCase().includes('usb-c') || product.name.toLowerCase().includes('usbc')) {
              value = "USB-C"
            } else if (product.name.toLowerCase().includes('usb-a') || product.name.toLowerCase().includes('usba')) {
              value = "USB-A"
            } else if (product.name.toLowerCase().includes('usb')) {
              value = "USB"
            } else if (product.name.toLowerCase().includes('hdmi')) {
              value = "HDMI"
            } else if (product.name.toLowerCase().includes('3.5')) {
              value = "3.5mm"
            } else {
              value = "Otro"
            }
            break
          case 'CONECTOR_ENTRADA':
          case 'INPUT_CONNECTOR':
            if (product.name.toLowerCase().includes('usb-c') || product.name.toLowerCase().includes('usbc')) {
              value = "USB-C"
            } else if (product.name.toLowerCase().includes('usb-a') || product.name.toLowerCase().includes('usba')) {
              value = "USB-A"
            } else if (product.name.toLowerCase().includes('usb')) {
              value = "USB"
            } else if (product.name.toLowerCase().includes('hdmi')) {
              value = "HDMI"
            } else if (product.name.toLowerCase().includes('3.5')) {
              value = "3.5mm"
            } else {
              value = "Otro"
            }
            break
          default:
            value = 'No especificado'
        }
        console.log(`🤖 Valor automático para ${attr.id}: ${value}`)
      }
      
      console.log(`✅ Atributo ${attr.id} (${attr.name}): ${value}`)
      attributes.push({
        id: attr.id,
        value_name: value
      })
    }
    
    // Siempre agregar BRAND y MODEL si no están presentes (incluso si no son requeridos)
    const hasModel = attributes.some(attr => attr.id === 'MODEL')
    const hasBrand = attributes.some(attr => attr.id === 'BRAND')
    
    if (!hasModel) {
      console.log('➕ Agregando MODEL faltante')
      attributes.push({
        id: "MODEL",
        value_name: product.internalCode || "Sin modelo"
      })
    }
    
    if (!hasBrand) {
      console.log('➕ Agregando BRAND faltante')
      attributes.push({
        id: "BRAND",
        value_name: "Genérico"
      })
    }
    
    console.log('📤 Atributos finales:', attributes)
    return attributes
  } catch (error) {
    console.warn('❌ Error getting dynamic attributes, using defaults:', error)
    // Fallback a atributos básicos pero siempre incluir BRAND y MODEL
    return [
      { id: "ITEM_CONDITION", value_name: "new" },
      { id: "BRAND", value_name: "Genérico" },
      { id: "MODEL", value_name: product.internalCode || "Sin modelo" }
    ]
  }
}

/**
 * Genera un título más descriptivo para MercadoLibre
 */
function generateDescriptiveTitle(product: ProductWithImages): string {
  let title = product.name
  
  // Si el título es muy corto (menos de 10 caracteres), mejorarlo
  if (title.length < 10) {
    const parts = []
    
    // Agregar marca si no está presente
    if (!title.toLowerCase().includes('genérico') && !title.toLowerCase().includes('marca')) {
      parts.push('Genérico')
    }
    
    // Agregar el nombre original
    parts.push(title)
    
    // Agregar código interno si existe
    if (product.internalCode && !title.includes(product.internalCode)) {
      parts.push(`Modelo ${product.internalCode}`)
    }
    
    // Agregar descripción genérica basada en categoría
    if (product.mlCategoryId === 'MLA5338') {
      parts.push('Cable Conector')
    }
    
    title = parts.join(' ')
  }
  
  // Asegurarse de que no sea demasiado largo (límite de ML es 60 caracteres)
  if (title.length > 60) {
    title = title.substring(0, 57) + '...'
  }
  
  return title
}

/**
 * Construye el JSON para publicar en MercadoLibre según su documentación (versión dinámica)
 */
async function buildMercadoLibreItemData(product: ProductWithImages, token: string): Promise<any> {
  const images = product.images ? product.images.split(',').filter(img => img.trim()) : []
  
  // Redondear precio a 2 decimales para ARS
  const price = Math.round(product.finalPriceArs * 100) / 100
  
  // Limitar stock al máximo permitido por ML (99999)
  const availableQuantity = Math.min(product.stock, 99999)
  
  // Determinar tipo de publicación basado en si hay imágenes
  // gold_special requiere imágenes obligatorias, usar bronze si no hay imágenes
  const listingType = images.length > 0 ? "bronze" : "bronze"
  
  // Obtener atributos dinámicos de la categoría
  const dynamicAttributes = await buildDynamicAttributes(token, product.mlCategoryId!, product)
  
  // Generar título más descriptivo
  const descriptiveTitle = generateDescriptiveTitle(product)
  
  const itemData = {
    title: descriptiveTitle,
    category_id: product.mlCategoryId,
    price: price,
    currency_id: "ARS",
    available_quantity: availableQuantity,
    buying_mode: "buy_it_now",
    listing_type_id: listingType,
    condition: "new",
    description: {
      plain_text: `${descriptiveTitle}${product.internalCode ? ` - Código: ${product.internalCode}` : ''}\n\nProducto de calidad, ideal para uso doméstico o profesional.`
    },
    warranty: "Garantía del vendedor: 30 días",
    sale_terms: [
      {
        id: "WARRANTY_TYPE",
        value_name: "Garantía del vendedor"
      },
      {
        id: "WARRANTY_TIME", 
        value_name: "30 días"
      }
    ],
    // Configuración de envío - usar me2 ya que me1 no está disponible
    shipping: {
      mode: "me2",
      free_shipping: true
    },
    // Usar atributos dinámicos obtenidos de la API
    attributes: dynamicAttributes
  }

  // Solo agregar imágenes si existen
  if (images.length > 0) {
    (itemData as any).pictures = images.map(url => ({ source: url }))
  }

  console.log('📦 Datos finales para ML:', JSON.stringify(itemData, null, 2))
  return itemData
}

/**
 * Sincroniza un producto con MercadoLibre (crear o actualizar)
 */
export async function syncProductToMercadoLibreAction(productId: string) {
  try {
    const token = await getValidToken()
    if (!token) {
      return { success: false, message: 'No hay conexión con MercadoLibre' }
    }

    // Obtener el producto con todos sus datos
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        productLead: true
      }
    }) as any

    if (!product) {
      return { success: false, message: 'Producto no encontrado' }
    }

    if (!product.mlCategoryId) {
      return { success: false, message: 'Primero debes seleccionar una categoría de MercadoLibre' }
    }

    // Construir datos para ML dinámicamente
    const itemData = await buildMercadoLibreItemData(product, token)
    
    let mlResponse
    let operation: 'created' | 'updated'

    if (product.mlItemId) {
      // Actualizar item existente
      mlResponse = await updateItem(token, product.mlItemId, itemData)
      operation = 'updated'
    } else {
      // Crear nuevo item
      mlResponse = await createItem(token, itemData)
      operation = 'created'
    }

    // Actualizar producto con datos de ML
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        mlItemId: mlResponse.id,
        mlStatus: mlResponse.status,
        mlLastSync: new Date(),
        mlSyncErrors: null, // Limpiar errores previos
        mlListingUrl: mlResponse.permalink // Actualizar URL de la publicación
      } as any
    })

    revalidatePath(`/comercializacion/productos/${productId}`)
    revalidatePath('/comercializacion/productos')
    
    return {
      success: true,
      message: `Producto ${operation === 'created' ? 'publicado' : 'actualizado'} en MercadoLibre exitosamente`,
      product: updatedProduct,
      mlResponse,
      operation
    }
  } catch (error) {
    console.error('Error syncing product to ML:', error)
    
    // Guardar error en el producto
    await prisma.product.update({
      where: { id: productId },
      data: {
        mlSyncErrors: error instanceof Error ? error.message : 'Error desconocido',
        mlLastSync: new Date()
      } as any
    }).catch(console.error)
    
    return {
      success: false,
      message: 'Error sincronizando con MercadoLibre: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

/**
 * Desactiva la sincronización de un producto y pausa la publicación en ML
 */
export async function pauseProductSyncAction(productId: string) {
  try {
    const token = await getValidToken()
    if (!token) {
      return { success: false, message: 'No hay conexión con MercadoLibre' }
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    }) as any

    if (!product || !product.mlItemId) {
      return { success: false, message: 'Producto no está sincronizado con MercadoLibre' }
    }

    // Pausar en MercadoLibre
    await updateItem(token, product.mlItemId, { status: 'paused' } as any)

    // Actualizar estado local
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        mlStatus: 'paused',
        mlSyncEnabled: false,
        mlLastSync: new Date()
      } as any
    })

    revalidatePath(`/comercializacion/productos/${productId}`)
    
    return {
      success: true,
      message: 'Sincronización pausada exitosamente',
      product: updatedProduct
    }
  } catch (error) {
    console.error('Error pausing product sync:', error)
    return {
      success: false,
      message: 'Error pausando sincronización: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

/**
 * Obtiene los atributos requeridos para una categoría específica
 */
export async function getRequiredAttributesAction(categoryId: string) {
  try {
    const token = await getValidToken()
    if (!token) {
      return { success: false, message: 'No hay conexión con MercadoLibre' }
    }

    const attributes = await getCategoryAttributes(token, categoryId)
    const requiredAttributes = attributes.filter((attr: MLAttribute) => attr.required)
    
    return {
      success: true,
      attributes: requiredAttributes
    }
  } catch (error) {
    console.error('Error getting required attributes:', error)
    return {
      success: false,
      message: 'Error obteniendo atributos: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

/**
 * Guarda los atributos personalizados para un producto
 */
export async function saveProductAttributesAction(productId: string, attributes: Record<string, string>) {
  try {
    // Guardamos los atributos como JSON en un campo del producto
    // Por ahora usaremos el campo mlSyncErrors como almacenamiento temporal
    const attributesJson = JSON.stringify(attributes)
    
    await prisma.product.update({
      where: { id: productId },
      data: {
        // Usaremos un campo temporal para los atributos hasta que podamos agregar un campo específico
        mlSyncErrors: `ATTRIBUTES:${attributesJson}`
      } as any
    })

    return {
      success: true,
      message: 'Atributos guardados exitosamente'
    }
  } catch (error) {
    console.error('Error saving attributes:', error)
    return {
      success: false,
      message: 'Error guardando atributos: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

export async function getProductMLStatusAction(productId: string) {
  try {
    const token = await getValidToken()
    if (!token) {
      return { success: false, message: 'No hay conexión con MercadoLibre' }
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    }) as any

    if (!product || !product.mlItemId) {
      return { success: false, message: 'Producto no está sincronizado con MercadoLibre' }
    }

    // Obtener estado actual desde ML
    const mlItem = await getItem(token, product.mlItemId)

    // Actualizar estado local
    await prisma.product.update({
      where: { id: productId },
      data: {
        mlStatus: mlItem.status,
        mlLastSync: new Date()
      } as any
    })

    return {
      success: true,
      mlItem
    }
  } catch (error) {
    console.error('Error getting ML status:', error)
    return {
      success: false,
      message: 'Error obteniendo estado: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

/**
 * NUEVAS FUNCIONES PARA SINCRONIZACIÓN BIDIRECCIONAL
 */

/**
 * Importa una publicación de MercadoLibre usando su código MLA
 */
export async function importMLListingAction(mlItemId: string) {
  try {
    console.log('🔄 Importando publicación de ML:', mlItemId)
    
    const token = await getValidToken()
    if (!token) {
      return { success: false, message: 'No hay conexión con MercadoLibre' }
    }

    // Obtener datos de la publicación desde ML
    const { getItemById } = await import('@/lib/mercadolibre')
    const mlItem = await getItemById(token, mlItemId)
    
    console.log('📦 Datos de ML obtenidos:', {
      id: mlItem.id,
      title: mlItem.title,
      price: mlItem.price,
      status: mlItem.status
    })

    // Verificar si ya existe esta publicación
    const existingListing = await prisma.mLListing.findUnique({
      where: { mlItemId: mlItemId }
    })

    if (existingListing) {
      return { 
        success: false, 
        message: 'Esta publicación ya está importada en el sistema',
        listing: existingListing
      }
    }

    // Crear la publicación en nuestra base de datos
    const newListing = await prisma.mLListing.create({
      data: {
        mlItemId: mlItem.id,
        title: mlItem.title,
        categoryId: mlItem.category_id,
        price: mlItem.price,
        currency: mlItem.currency_id,
        condition: mlItem.condition,
        status: mlItem.status,
        permalink: mlItem.permalink,
        thumbnail: mlItem.thumbnail,
        listingType: mlItem.listing_type_id,
        buyingMode: mlItem.buying_mode,
        freeShipping: mlItem.shipping?.free_shipping || false,
        officialStore: mlItem.official_store_id !== null,
        lastSyncAt: new Date()
      }
    })

    console.log('✅ Publicación importada correctamente:', newListing.id)

    revalidatePath('/comercializacion/mercadolibre')
    
    return {
      success: true,
      message: 'Publicación importada correctamente',
      listing: newListing
    }
  } catch (error) {
    console.error('❌ Error importando publicación:', error)
    return {
      success: false,
      message: 'Error importando publicación: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

/**
 * Conecta una publicación de ML con uno o más productos internos
 */
export async function connectMLListingToProductsAction(
  listingId: string, 
  productMappings: Array<{ productId: string; quantity: number; priority: number }>
) {
  try {
    console.log('🔗 Conectando publicación con productos:', { listingId, productMappings })

    // Verificar que la publicación existe
    const listing = await prisma.mLListing.findUnique({
      where: { id: listingId }
    })

    if (!listing) {
      return { success: false, message: 'Publicación no encontrada' }
    }

    // Limpiar mapeos existentes
    await prisma.mLStockMapping.deleteMany({
      where: { listingId: listingId }
    })

    // Crear nuevos mapeos
    const stockMappings = await Promise.all(
      productMappings.map(mapping => 
        prisma.mLStockMapping.create({
          data: {
            listingId: listingId,
            productId: mapping.productId,
            quantity: mapping.quantity,
            priority: mapping.priority
          }
        })
      )
    )

    // Intentar calcular y actualizar stock en ML
    const stockUpdateResult = await updateMLListingStockAction(listingId)

    revalidatePath('/comercializacion/mercadolibre')
    
    // Si la conexión fue exitosa pero la actualización de stock falló
    if (!stockUpdateResult.success) {
      if (stockUpdateResult.isWarning) {
        return {
          success: true,
          message: `Productos conectados correctamente. ${stockUpdateResult.message}`,
          stockMappings,
          stockWarning: stockUpdateResult.message
        }
      } else {
        return {
          success: true,
          message: `Productos conectados correctamente, pero no se pudo actualizar el stock en ML: ${stockUpdateResult.message}`,
          stockMappings,
          stockError: stockUpdateResult.message
        }
      }
    }
    
    return {
      success: true,
      message: `Productos conectados y stock actualizado correctamente: ${stockUpdateResult.stock} unidades`,
      stockMappings,
      stock: stockUpdateResult.stock
    }
  } catch (error) {
    console.error('❌ Error conectando productos:', error)
    return {
      success: false,
      message: 'Error conectando productos: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

/**
 * Actualiza el stock de una publicación de ML basado en los productos mapeados
 */
export async function updateMLListingStockAction(listingId: string) {
  try {
    console.log('📊 Actualizando stock para publicación:', listingId)

    const token = await getValidToken()
    if (!token) {
      return { success: false, message: 'No hay conexión con MercadoLibre' }
    }

    // Obtener la publicación y sus mapeos
    const listing = await prisma.mLListing.findUnique({
      where: { id: listingId },
      include: {
        stockMappings: {
          where: { enabled: true },
          include: { product: true },
          orderBy: { priority: 'asc' }
        }
      }
    })

    if (!listing) {
      return { success: false, message: 'Publicación no encontrada' }
    }

    if (listing.stockMappings.length === 0) {
      return { success: false, message: 'No hay productos mapeados a esta publicación' }
    }

    // Calcular stock disponible
    let availableStock = 0
    
    for (const mapping of listing.stockMappings) {
      const productStock = mapping.product.stock
      const possibleUnits = Math.floor(productStock / mapping.quantity)
      
      if (availableStock === 0) {
        availableStock = possibleUnits
      } else {
        availableStock = Math.min(availableStock, possibleUnits)
      }
    }

    console.log('📦 Stock calculado:', availableStock)

    // Actualizar stock en MercadoLibre
    const { updateItemStock } = await import('@/lib/mercadolibre')
    await updateItemStock(token, listing.mlItemId, availableStock)

    // Actualizar timestamp de sincronización
    await prisma.mLListing.update({
      where: { id: listingId },
      data: { 
        lastSyncAt: new Date(),
        syncErrors: null
      }
    })

    return {
      success: true,
      message: `Stock actualizado correctamente: ${availableStock} unidades`,
      stock: availableStock
    }
  } catch (error) {
    console.error('❌ Error actualizando stock:', error)
    
    let errorMessage = error instanceof Error ? error.message : 'Unknown error'
    let isWarning = false
    
    // Detectar si es el error específico de stock no modificable
    if (errorMessage.includes('STOCK_NOT_UPDATABLE:')) {
      errorMessage = errorMessage.replace('STOCK_NOT_UPDATABLE: ', '')
      isWarning = true
    }
    
    // Guardar error en la base de datos
    await prisma.mLListing.update({
      where: { id: listingId },
      data: { 
        syncErrors: isWarning ? `WARNING: ${errorMessage}` : errorMessage,
        lastSyncAt: new Date()
      }
    }).catch(console.error)

    return {
      success: false,
      message: errorMessage,
      isWarning: isWarning
    }
  }
}

/**
 * Sincroniza todas las publicaciones activas
 */
export async function syncAllMLListingsAction() {
  try {
    console.log('🔄 Sincronizando todas las publicaciones...')

    const listings = await prisma.mLListing.findMany({
      where: { 
        syncEnabled: true,
        status: { in: ['active', 'paused'] }
      }
    })

    const results = await Promise.allSettled(
      listings.map(listing => updateMLListingStockAction(listing.id))
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return {
      success: true,
      message: `Sincronización completada: ${successful} exitosas, ${failed} fallidas`,
      stats: { successful, failed, total: results.length }
    }
  } catch (error) {
    console.error('❌ Error en sincronización masiva:', error)
    return {
      success: false,
      message: 'Error en sincronización masiva: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
}

/**
 * Obtiene todas las publicaciones de ML con sus mapeos
 */
export async function getMLListingsWithMappingsAction() {
  try {
    const listings = await prisma.mLListing.findMany({
      include: {
        stockMappings: {
          include: {
            product: {
              include: {
                productLead: true
              }
            }
          },
          orderBy: { priority: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      listings
    }
  } catch (error) {
    console.error('❌ Error obteniendo publicaciones:', error)
    return {
      success: false,
      message: 'Error obteniendo publicaciones: ' + (error instanceof Error ? error.message : 'Unknown error'),
      listings: []
    }
  }
}

/**
 * Elimina una publicación de la sincronización (no la borra de ML)
 */
export async function removeMLListingAction(listingId: string) {
  try {
    await prisma.mLListing.delete({
      where: { id: listingId }
    })

    revalidatePath('/comercializacion/mercadolibre')
    
    return {
      success: true,
      message: 'Publicación eliminada de la sincronización'
    }
  } catch (error) {
    console.error('❌ Error eliminando publicación:', error)
    return {
      success: false,
      message: 'Error eliminando publicación: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
} 