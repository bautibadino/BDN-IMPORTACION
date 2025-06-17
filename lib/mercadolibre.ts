import type { MercadoLibreAuthResponse, MercadoLibreItem, MercadoLibreToken, CategorySearchResult } from "@/lib/types"

// Configuración de MercadoLibre desde variables de entorno
export const MERCADOLIBRE_CONFIG = {
  APP_ID: process.env.MERCADOLIBRE_APP_ID!,
  CLIENT_SECRET: process.env.MERCADOLIBRE_CLIENT_SECRET!,
  REDIRECT_URI: process.env.MERCADOLIBRE_REDIRECT_URI!,
  SITE_ID: process.env.MERCADOLIBRE_SITE_ID!,
  API_URL: process.env.MERCADOLIBRE_API_URL || 'https://api.mercadolibre.com',
}

/**
 * Genera la URL de autorización para MercadoLibre (SIN PKCE)
 */
export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: MERCADOLIBRE_CONFIG.APP_ID,
    redirect_uri: MERCADOLIBRE_CONFIG.REDIRECT_URI,
  })
  
  return `https://auth.mercadolibre.com.ar/authorization?${params.toString()}`
}

/**
 * Intercambia el código de autorización por tokens de acceso (SIN PKCE)
 */
export async function exchangeCodeForTokens(code: string): Promise<MercadoLibreAuthResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: MERCADOLIBRE_CONFIG.APP_ID,
    client_secret: MERCADOLIBRE_CONFIG.CLIENT_SECRET,
    code: code,
    redirect_uri: MERCADOLIBRE_CONFIG.REDIRECT_URI,
  })

  console.log('🔍 Datos enviados a MercadoLibre:')
  console.log('- URL:', `${MERCADOLIBRE_CONFIG.API_URL}/oauth/token`)
  console.log('- client_id:', MERCADOLIBRE_CONFIG.APP_ID)
  console.log('- redirect_uri:', MERCADOLIBRE_CONFIG.REDIRECT_URI)
  console.log('- code:', code)
  console.log('- Body completo:', body.toString())

  const response = await fetch(`${MERCADOLIBRE_CONFIG.API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body,
  })
  
  console.log('📡 Respuesta de MercadoLibre:')
  console.log('- Status:', response.status)
  console.log('- StatusText:', response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Error completo:', errorText)
    throw new Error(`Error exchanging code: ${response.status} ${response.statusText} - ${errorText}`)
  }
  
  return response.json()
}

/**
 * Renueva el access token usando el refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<MercadoLibreAuthResponse> {
  const response = await fetch(`${MERCADOLIBRE_CONFIG.API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: MERCADOLIBRE_CONFIG.APP_ID,
      client_secret: MERCADOLIBRE_CONFIG.CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`Error refreshing token: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Realiza una llamada autenticada a la API de MercadoLibre
 */
export async function makeAuthenticatedRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${MERCADOLIBRE_CONFIG.API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

/**
 * Obtiene las categorías de MercadoLibre
 */
export async function getCategories(token: string): Promise<any[]> {
  const response = await makeAuthenticatedRequest(
    `/sites/${MERCADOLIBRE_CONFIG.SITE_ID}/categories`,
    token
  )
  
  if (!response.ok) {
    throw new Error(`Error fetching categories: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Busca categorías por nombre usando caché local o API de MercadoLibre
 */
export async function searchCategories(query: string, accessToken: string): Promise<CategorySearchResult[]> {
  try {
    console.log('🔍 Buscando categorías usando predictor para:', query);
    
    // Usar el predictor de categorías de MercadoLibre
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mercadolibre.com/sites/MLA/domain_discovery/search?limit=3&q=${encodedQuery}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Error en predictor de categorías:', response.status, response.statusText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const predictions = await response.json();
    console.log('📊 Predicciones recibidas:', predictions.length);

    // Convertir las predicciones al formato esperado
    const results: CategorySearchResult[] = predictions.map((prediction: any) => ({
      id: prediction.category_id,
      name: prediction.category_name,
      total_items_in_this_category: 0, // No disponible en predictor
      path_from_root: [], // Se podría obtener con otra llamada si es necesario
      children_categories: [], // No disponible en predictor
      attribute_types: "required_attributes", // Valor por defecto
      settings: {
        adult_content: false,
        buying_allowed: true,
        buying_modes: ["buy_it_now"],
        catalog_domain: prediction.domain_id,
        coverage_areas: "not_allowed",
        currencies: ["ARS"],
        fragile: false,
        immediate_payment: "required",
        item_conditions: ["new"],
        items_reviews_allowed: false,
        listing_allowed: true,
        max_description_length: 50000,
        max_pictures_per_item: 12,
        max_pictures_per_item_var: 10,
        max_sub_title_length: 70,
        max_title_length: 60,
        maximum_price: null,
        maximum_price_currency: "ARS",
        minimum_price: 0,
        minimum_price_currency: "ARS",
        mirror_category: null,
        mirror_master_category: null,
        mirror_slave_categories: [],
        moderation: "moderated",
        nearby_areas: "not_allowed",
        pictures: "required",
        price: "required",
        reservation_allowed: "not_allowed",
        restrictions: [],
        rounded_address: false,
        seller_contact: "not_allowed",
        shipping_modes: ["custom", "me2"],
        shipping_options: ["custom"],
        shipping_profile: "optional",
        show_contact_information: false,
        simple_shipping: "required",
        stock: "required",
        sub_vertical: prediction.domain_name,
        subscribable: false,
        tags: [],
        vertical: prediction.domain_name,
        vip_subdomain: "listado",
        buyer_protection_programs: ["mercado_pago"],
        status: "enabled"
      },
      // Agregar información adicional del predictor
      domain_id: prediction.domain_id,
      domain_name: prediction.domain_name,
      predicted_attributes: prediction.attributes || []
    }));

    console.log('✅ Categorías encontradas:', results.length);
    results.forEach(result => {
      console.log(`  📂 ${result.id}: ${result.name} (${result.domain_name})`);
    });

    return results;

  } catch (error) {
    console.error('❌ Error en búsqueda de categorías:', error);
    
    // Fallback a categorías tecnológicas específicas
    console.log('🔄 Usando categorías de fallback para productos tecnológicos...');
    
    const fallbackCategories = [
      {
        id: "MLA430918",
        name: "Cables y Hubs USB",
        total_items_in_this_category: 0,
        path_from_root: [],
        children_categories: [],
        attribute_types: "required_attributes" as const,
        settings: {
          adult_content: false,
          buying_allowed: true,
          buying_modes: ["buy_it_now"] as const,
          catalog_domain: "MLA-COMPUTER_ACCESSORIES",
          coverage_areas: "not_allowed" as const,
          currencies: ["ARS"] as const,
          fragile: false,
          immediate_payment: "required" as const,
          item_conditions: ["new"] as const,
          items_reviews_allowed: false,
          listing_allowed: true,
          max_description_length: 50000,
          max_pictures_per_item: 12,
          max_pictures_per_item_var: 10,
          max_sub_title_length: 70,
          max_title_length: 60,
          maximum_price: null,
          maximum_price_currency: "ARS" as const,
          minimum_price: 0,
          minimum_price_currency: "ARS" as const,
          mirror_category: null,
          mirror_master_category: null,
          mirror_slave_categories: [],
          moderation: "moderated" as const,
          nearby_areas: "not_allowed" as const,
          pictures: "required" as const,
          price: "required" as const,
          reservation_allowed: "not_allowed" as const,
          restrictions: [],
          rounded_address: false,
          seller_contact: "not_allowed" as const,
          shipping_modes: ["custom", "me2"] as const,
          shipping_options: ["custom"] as const,
          shipping_profile: "optional" as const,
          show_contact_information: false,
          simple_shipping: "required" as const,
          stock: "required" as const,
          sub_vertical: "Cables y Hubs USB",
          subscribable: false,
          tags: [],
          vertical: "Computación",
          vip_subdomain: "listado" as const,
          buyer_protection_programs: ["mercado_pago"] as const,
          status: "enabled" as const
        },
        domain_id: "MLA-COMPUTER_ACCESSORIES",
        domain_name: "Accesorios para Computación",
        predicted_attributes: []
      },
      {
        id: "MLA3502",
        name: "Accesorios para Celulares",
        total_items_in_this_category: 0,
        path_from_root: [],
        children_categories: [],
        attribute_types: "required_attributes" as const,
        settings: {
          adult_content: false,
          buying_allowed: true,
          buying_modes: ["buy_it_now"] as const,
          catalog_domain: "MLA-CELL_PHONE_ACCESSORIES",
          coverage_areas: "not_allowed" as const,
          currencies: ["ARS"] as const,
          fragile: false,
          immediate_payment: "required" as const,
          item_conditions: ["new"] as const,
          items_reviews_allowed: false,
          listing_allowed: true,
          max_description_length: 50000,
          max_pictures_per_item: 12,
          max_pictures_per_item_var: 10,
          max_sub_title_length: 70,
          max_title_length: 60,
          maximum_price: null,
          maximum_price_currency: "ARS" as const,
          minimum_price: 0,
          minimum_price_currency: "ARS" as const,
          mirror_category: null,
          mirror_master_category: null,
          mirror_slave_categories: [],
          moderation: "moderated" as const,
          nearby_areas: "not_allowed" as const,
          pictures: "required" as const,
          price: "required" as const,
          reservation_allowed: "not_allowed" as const,
          restrictions: [],
          rounded_address: false,
          seller_contact: "not_allowed" as const,
          shipping_modes: ["custom", "me2"] as const,
          shipping_options: ["custom"] as const,
          shipping_profile: "optional" as const,
          show_contact_information: false,
          simple_shipping: "required" as const,
          stock: "required" as const,
          sub_vertical: "Accesorios para Celulares",
          subscribable: false,
          tags: [],
          vertical: "Celulares y Teléfonos",
          vip_subdomain: "listado" as const,
          buyer_protection_programs: ["mercado_pago"] as const,
          status: "enabled" as const
        },
        domain_id: "MLA-CELL_PHONE_ACCESSORIES",
        domain_name: "Accesorios para Celulares",
        predicted_attributes: []
      }
    ];

    return fallbackCategories;
  }
}

/**
 * Obtiene detalles de una categoría específica
 */
export async function getCategoryDetails(token: string, categoryId: string): Promise<any> {
  const response = await makeAuthenticatedRequest(
    `/categories/${categoryId}`,
    token
  )
  
  if (!response.ok) {
    throw new Error(`Error fetching category details: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Obtiene atributos requeridos para una categoría
 */
export async function getCategoryAttributes(token: string, categoryId: string): Promise<any> {
  const response = await makeAuthenticatedRequest(
    `/categories/${categoryId}/attributes`,
    token
  )
  
  if (!response.ok) {
    throw new Error(`Error fetching category attributes: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Crea un item en MercadoLibre
 */
export async function createItem(token: string, itemData: Partial<MercadoLibreItem>): Promise<any> {
  const response = await makeAuthenticatedRequest('/items', token, {
    method: 'POST',
    body: JSON.stringify(itemData),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Error creating item: ${response.statusText} - ${JSON.stringify(error)}`)
  }
  
  return response.json()
}

/**
 * Actualiza un item en MercadoLibre
 */
export async function updateItem(token: string, itemId: string, itemData: Partial<MercadoLibreItem>): Promise<any> {
  const response = await makeAuthenticatedRequest(`/items/${itemId}`, token, {
    method: 'PUT',
    body: JSON.stringify(itemData),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Error updating item: ${response.statusText} - ${JSON.stringify(error)}`)
  }
  
  return response.json()
}

/**
 * Obtiene un item de MercadoLibre
 */
export async function getItem(token: string, itemId: string): Promise<any> {
  const response = await makeAuthenticatedRequest(`/items/${itemId}`, token)
  
  if (!response.ok) {
    throw new Error(`Error fetching item: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Verifica si un token ha expirado
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt
}

/**
 * Calcula la fecha de expiración basada en expires_in (en segundos)
 */
export function calculateExpirationDate(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000)
}

/**
 * Obtiene subcategorías de una categoría específica
 */
export async function getSubcategories(token: string, categoryId: string): Promise<any[]> {
  try {
    const response = await makeAuthenticatedRequest(
      `/categories/${categoryId}`,
      token
    )
    
    if (!response.ok) {
      throw new Error(`Error fetching subcategories: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.children_categories || []
  } catch (error) {
    console.error('❌ Error obteniendo subcategorías:', error)
    return []
  }
}

/**
 * Obtiene los datos de un item específico de MercadoLibre por su ID
 */
export async function getItemById(token: string, itemId: string): Promise<any> {
  const response = await makeAuthenticatedRequest(`/items/${itemId}`, token)
  
  if (!response.ok) {
    throw new Error(`Error fetching item ${itemId}: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Obtiene todas las publicaciones activas del usuario
 */
export async function getUserItems(token: string, status?: string): Promise<any> {
  let endpoint = '/users/me/items/search'
  if (status) {
    endpoint += `?status=${status}`
  }
  
  const response = await makeAuthenticatedRequest(endpoint, token)
  
  if (!response.ok) {
    throw new Error(`Error fetching user items: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Busca publicaciones por SKU o título
 */
export async function searchUserItems(token: string, query: string): Promise<any> {
  const encodedQuery = encodeURIComponent(query)
  const response = await makeAuthenticatedRequest(`/users/me/items/search?q=${encodedQuery}`, token)
  
  if (!response.ok) {
    throw new Error(`Error searching user items: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Actualiza el stock de un item en MercadoLibre
 */
export async function updateItemStock(token: string, itemId: string, availableQuantity: number): Promise<any> {
  const response = await makeAuthenticatedRequest(`/items/${itemId}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      available_quantity: availableQuantity
    })
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    
    // Detectar error específico de stock no modificable
    if (error.cause && error.cause.some((c: any) => c.code === 'field_not_updatable' && c.references?.includes('available_quantity'))) {
      throw new Error(`STOCK_NOT_UPDATABLE: Esta publicación tiene ofertas activas o ventas en proceso. MercadoLibre no permite modificar el stock en este estado. Debes esperar a que se completen las transacciones o pausar la publicación temporalmente.`)
    }
    
    throw new Error(`Error updating stock for item ${itemId}: ${response.statusText} - ${JSON.stringify(error)}`)
  }
  
  return response.json()
}

/**
 * Actualiza el precio de un item en MercadoLibre
 */
export async function updateItemPrice(token: string, itemId: string, price: number): Promise<any> {
  const response = await makeAuthenticatedRequest(`/items/${itemId}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      price: price
    })
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Error updating price for item ${itemId}: ${response.statusText} - ${JSON.stringify(error)}`)
  }
  
  return response.json()
}

/**
 * Pausa/reactiva una publicación
 */
export async function updateItemStatus(token: string, itemId: string, status: 'active' | 'paused'): Promise<any> {
  const response = await makeAuthenticatedRequest(`/items/${itemId}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      status: status
    })
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Error updating status for item ${itemId}: ${response.statusText} - ${JSON.stringify(error)}`)
  }
  
  return response.json()
} 