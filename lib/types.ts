// Re-exportar tipos generados por Prisma para usarlos en la aplicación
export type {
  Supplier,
  ProductLead,
  Order,
  OrderItem,
  ImportCost,
  Product,
  SupplierNote,
  ProductLeadStatus,
  Document,
} from "@prisma/client"

// Tipo para ProductBatch (definido manualmente hasta que TypeScript lo reconozca)
export type ProductBatch = {
  id: string
  batchNumber: string
  quantity: number
  unitCostUsd: number
  totalCostUsd: number
  receivedAt: Date
  location?: string | null
  notes?: string | null
  productId: string
  orderId: string
  productLeadId: string
}

// Mantener los tipos de formulario que son útiles para las Server Actions y los formularios
export type SupplierFormData = {
  name: string
  country?: string | null
  contactName?: string | null
  whatsapp?: string | null
  email?: string | null
  source?: string | null
  language?: string | null
  rating?: number | null
  isVerified?: boolean | null
  firstContact?: string | null
  tags?: string | null
}

export type SupplierNoteFormData = {
  supplierId: string
  note: string
  addedBy?: string | null
}

export type ProductLeadFormData = {
  name: string
  category?: string | null
  supplierId: string
  referencePriceUsd?: number | null
  moq?: number | null
  currency?: string | null
  volumeM3?: number | null
  weightKg?: number | null
  photoUrl?: string | null
  sourceUrl?: string | null
  tags?: string | null
}

export type ProductLeadStatusFormData = {
  productLeadId: string
  status: "visto" | "contacto" | "muestra" | "pedido" | "descartado"
  note?: string | null
  addedBy?: string | null
}

export type OrderFormData = {
  orderNumber: string
  shipmentType: "aéreo" | "marítimo" | "terrestre"
  incoterm: "EXW" | "FOB" | "CIF" | "DDP"
  status:
    | "borrador"
    | "pendiente_pago"
    | "pagado"
    | "en_producción"
    | "listo_embarque"
    | "embarcado"
    | "en_tránsito"
    | "en_aduana"
    | "recibido"
    | "cancelado"
  forwarder?: string | null
  orderDate: string
  trackingCode?: string | null
  estimatedArrival?: string | null
  portOfOrigin?: string | null
  portOfDestination?: string | null
}

export type OrderItemFormData = {
  orderId: string
  productLeadId: string
  quantity: number
  unitPriceUsd: number
  discountPercent?: number | null
}

export type ImportCostFormData = {
  orderId: string
  type:
    | "flete_internacional"
    | "flete_local"
    | "aduana_impuestos"
    | "seguro"
    | "almacenaje"
    | "despachante"
    | "bancarios"
    | "otros"
  amountUsd: number
  description?: string | null
  appliesTo?: string | null
}

export type DocumentFormData = {
  orderId: string
  type:
    | "proforma_invoice"
    | "commercial_invoice"
    | "packing_list"
    | "bill_of_lading"
    | "certificate_of_origin"
    | "insurance_policy"
    | "other"
  fileUrl: string
  note?: string | null
}

export type ProductFormData = {
  productLeadId?: string | null
  name: string
  internalCode?: string | null
  finalUnitCostUsd: number
  markupPercentage: number
  stock: number
  location?: string | null
  images?: string | null
}

// Tipo extendido para Product que incluye el nuevo campo images y campos ML
export type ProductWithImages = {
  id: string
  name: string
  internalCode: string | null
  finalUnitCostUsd: number
  finalUnitCostArs: number
  markupPercentage: number
  finalPriceArs: number
  stock: number
  location: string | null
  images: string | null
  productLeadId: string
  // Campos de MercadoLibre
  mlItemId?: string | null
  mlStatus?: string | null
  mlCategoryId?: string | null
  mlLastSync?: Date | null
  mlSyncEnabled?: boolean | null
  mlSyncErrors?: string | null
}

// Tipo extendido para Product que incluye categorías y lotes
export type ProductWithCategories = {
  id: string
  name: string
  internalCode: string | null
  finalUnitCostUsd: number
  finalUnitCostArs: number
  markupPercentage: number
  finalPriceArs: number
  stock: number
  location: string | null
  images: string | null
  productLeadId: string
  categories?: ProductCategory[]
  batches?: ProductBatch[]
}

// Tipos específicos para MercadoLibre
export type MercadoLibreToken = {
  id: string
  accessToken: string
  refreshToken: string
  expiresAt: Date
  userId: string | null
  createdAt: Date
  updatedAt: Date
}

export type MercadoLibreAuthResponse = {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  user_id: number
  refresh_token: string
}

export type MercadoLibreItem = {
  id: string
  title: string
  category_id: string
  price: number
  currency_id: string
  available_quantity: number
  condition: string
  listing_type_id: string
  pictures: Array<{
    source: string
  }>
  attributes: Array<{
    id: string
    value_name: string
  }>
}

// Tipo para resultados de búsqueda de categorías usando el predictor de MercadoLibre
export type CategorySearchResult = {
  id: string
  name: string
  total_items_in_this_category: number
  path_from_root: Array<{
    id: string
    name: string
  }>
  children_categories: Array<{
    id: string
    name: string
    total_items_in_this_category: number
  }>
  attribute_types: string
  settings: {
    adult_content: boolean
    buying_allowed: boolean
    buying_modes: readonly string[]
    catalog_domain: string
    coverage_areas: string
    currencies: readonly string[]
    fragile: boolean
    immediate_payment: string
    item_conditions: readonly string[]
    items_reviews_allowed: boolean
    listing_allowed: boolean
    max_description_length: number
    max_pictures_per_item: number
    max_pictures_per_item_var: number
    max_sub_title_length: number
    max_title_length: number
    maximum_price: number | null
    maximum_price_currency: string
    minimum_price: number
    minimum_price_currency: string
    mirror_category: string | null
    mirror_master_category: string | null
    mirror_slave_categories: readonly string[]
    moderation: string
    nearby_areas: string
    pictures: string
    price: string
    reservation_allowed: string
    restrictions: readonly string[]
    rounded_address: boolean
    seller_contact: string
    shipping_modes: readonly string[]
    shipping_options: readonly string[]
    shipping_profile: string
    show_contact_information: boolean
    simple_shipping: string
    stock: string
    sub_vertical: string
    subscribable: boolean
    tags: readonly string[]
    vertical: string
    vip_subdomain: string
    buyer_protection_programs: readonly string[]
    status: string
  }
  // Campos adicionales del predictor de categorías
  domain_id?: string
  domain_name?: string
  predicted_attributes?: Array<{
    id: string
    value_id?: string
    value_name?: string
  }>
}

// Tipos para el sistema de categorías
export interface Category {
  id: string
  name: string
  slug: string
  type: 'marca' | 'tipo' | 'rubro' | 'material' | 'color' | 'tamaño' | 'otros'
  description?: string
  color?: string
  icon?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  parentId?: string
  parent?: Category
  children?: Category[]
  productCategories?: ProductCategory[]
}

export interface ProductCategory {
  id: string
  productId: string
  categoryId: string
  isPrimary: boolean
  createdAt: Date
  category?: Category
}

export interface CategoryFormData {
  name: string
  type: 'marca' | 'tipo' | 'rubro' | 'material' | 'color' | 'tamaño' | 'otros'
  description?: string
  color?: string
  icon?: string
  parentId?: string
}

export interface ProductCategoryFormData {
  productId: string
  categoryIds: string[]
  primaryCategoryId?: string
}
