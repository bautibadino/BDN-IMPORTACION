import prisma from "./prisma"
import type {
  Supplier,
  ProductLead,
  Product,
  ProductLeadStatusFormData,
  SupplierNoteFormData,
  OrderFormData,
  OrderItemFormData,
  ImportCostFormData,
  DocumentFormData,
} from "./types" // Seguiremos usando los tipos de formulario

// --- Supplier Functions ---
export const getSuppliers = async () => await prisma.supplier.findMany({ orderBy: { name: "asc" } })
export const getSupplierById = async (id: string) => await prisma.supplier.findUnique({ where: { id } })
export const addSupplier = async (data: Omit<Supplier, "id">) => await prisma.supplier.create({ data })
export const updateSupplier = async (id: string, data: Partial<Omit<Supplier, "id">>) =>
  await prisma.supplier.update({ where: { id }, data })
export const deleteSupplier = async (id: string) => await prisma.supplier.delete({ where: { id } })
export const getSupplierNotes = async (supplierId: string) =>
  await prisma.supplierNote.findMany({ where: { supplierId }, orderBy: { date: "desc" } })
export const addSupplierNote = async (data: SupplierNoteFormData) => await prisma.supplierNote.create({ data })

// --- ProductLead Functions ---
export const getProductLeads = async () => await prisma.productLead.findMany({ orderBy: { createdAt: "desc" } })
export const getProductLeadById = async (id: string) => await prisma.productLead.findUnique({ where: { id } })
export const addProductLead = async (data: Omit<ProductLead, "id" | "createdAt">) =>
  await prisma.productLead.create({ data })
export const updateProductLead = async (id: string, data: Partial<Omit<ProductLead, "id" | "createdAt">>) =>
  await prisma.productLead.update({ where: { id }, data })
export const getProductLeadStatuses = async (productLeadId: string) =>
  await prisma.productLeadStatus.findMany({ where: { productLeadId }, orderBy: { date: "desc" } })
export const addProductLeadStatus = async (data: ProductLeadStatusFormData) =>
  await prisma.productLeadStatus.create({ data })

export interface ProductLeadWithDetails extends ProductLead {
  supplierName: string
  latestStatus?: string
}
export const getProductLeadsWithDetails = async (): Promise<ProductLeadWithDetails[]> => {
  const leads = await prisma.productLead.findMany({
    include: {
      supplier: true,
      statuses: {
        orderBy: { date: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return leads.map((lead) => ({
    ...lead,
    supplierName: lead.supplier.name,
    latestStatus: lead.statuses[0]?.status,
  }))
}

// --- Order Functions ---
export const getOrders = async () => await prisma.order.findMany({ orderBy: { orderDate: "desc" } })
export const getOrderById = async (id: string) => await prisma.order.findUnique({ where: { id } })
export const addOrder = async (data: OrderFormData, items: Omit<OrderItemFormData, "orderId">[]) => {
  return await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        ...data,
        orderNumber: `PO-${new Date().getFullYear()}-${String(await tx.order.count()).padStart(4, "0")}`,
      },
    })
    for (const item of items) {
      await tx.orderItem.create({
        data: {
          ...item,
          orderId: newOrder.id,
        },
      })
    }
    return newOrder
  })
}
export const updateOrder = async (id: string, data: Partial<OrderFormData>) =>
  await prisma.order.update({ where: { id }, data })

// --- OrderItem, Cost, Document Functions ---
export const getOrderItemsByOrderId = async (orderId: string) => await prisma.orderItem.findMany({ where: { orderId } })
export const getOrderItemsWithProductsByOrderId = async (orderId: string) => 
  await prisma.orderItem.findMany({ 
    where: { orderId },
    include: { productLead: true }
  })
export const addOrderItem = async (data: OrderItemFormData) => await prisma.orderItem.create({ data })
export const getImportCostsByOrderId = async (orderId: string) =>
  await prisma.importCost.findMany({ where: { orderId } })
export const addImportCost = async (data: ImportCostFormData) => await prisma.importCost.create({ data })
export const getDocumentsByOrderId = async (orderId: string) => await prisma.document.findMany({ where: { orderId } })
export const addDocument = async (data: DocumentFormData) => await prisma.document.create({ data })

// --- Product Functions ---
export const getProducts = async () => await prisma.product.findMany({ 
  orderBy: { name: "asc" },
  include: { batches: true }
})
export const getProductById = async (id: string) => await prisma.product.findUnique({ 
  where: { id },
  include: { batches: { orderBy: { receivedAt: "desc" } } }
})
export const getProductByProductLeadId = async (productLeadId: string) =>
  await prisma.product.findUnique({ 
    where: { productLeadId },
    include: { batches: { orderBy: { receivedAt: "desc" } } }
  })
export const addProduct = async (data: Omit<Product, "id">) => await prisma.product.create({ data })
export const updateProduct = async (id: string, data: Partial<Omit<Product, "id">>) =>
  await prisma.product.update({ where: { id }, data })
export const deleteProduct = async (id: string) => await prisma.product.delete({ where: { id } })

// --- ProductBatch Functions ---
export const addProductBatch = async (data: {
  batchNumber: string
  quantity: number
  unitCostUsd: number
  totalCostUsd: number
  location?: string | null
  notes?: string | null
  productId: string
  orderId: string
  productLeadId: string
}) => {
  console.log("Creating ProductBatch with data:", data)
  const result = await prisma.productBatch.create({ data })
  console.log("ProductBatch created successfully:", result)
  return result
}

export const getProductBatchesByProductId = async (productId: string) =>
  await prisma.productBatch.findMany({ 
    where: { productId },
    orderBy: { receivedAt: "desc" }
  })

export const getProductBatchesByOrderId = async (orderId: string) =>
  await prisma.productBatch.findMany({ 
    where: { orderId },
    include: { product: true, productLead: true }
  })

// Función para calcular el costo promedio de un producto basado en sus lotes
export const calculateAverageProductCost = async (productId: string): Promise<number> => {
  const batches = await getProductBatchesByProductId(productId)
  if (batches.length === 0) return 0
  
  const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0)
  const totalCost = batches.reduce((sum, batch) => sum + batch.totalCostUsd, 0)
  
  return totalQuantity > 0 ? totalCost / totalQuantity : 0
}
