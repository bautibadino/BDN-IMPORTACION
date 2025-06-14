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
  mlListingUrl?: string | null
  images?: string | null
}

// Tipo extendido para Product que incluye el nuevo campo images
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
  mlListingUrl: string | null
  images: string | null
  productLeadId: string
}
