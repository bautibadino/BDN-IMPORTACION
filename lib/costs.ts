import type { OrderItem, ImportCost, ProductLead } from "@/lib/types"

// Tipo para los items con sus detalles de ProductLead
export type OrderItemWithProduct = OrderItem & {
  productLead: ProductLead
}

// Tipo para el resultado del cálculo de costos
export type CostBreakdown = {
  orderId: string
  productLeadId: string
  productName: string
  quantity: number
  unitPriceFobUsd: number
  totalFobUsd: number
  importCostPerUnit: number
  totalImportCost: number
  finalUnitCostUsd: number
  totalFinalCostUsd: number
  importCostBreakdown: {
    type: string
    amountPerUnit: number
    totalAmount: number
  }[]
}

// Tipo para el resultado completo del cálculo
export type OrderCostCalculation = {
  orderId: string
  totalFobUsd: number
  totalImportCostsUsd: number
  totalFinalCostUsd: number
  items: CostBreakdown[]
  importCosts: ImportCost[]
}

/**
 * Calcula y prorratea los costos de importación entre los items de una orden
 * @param orderItems - Items de la orden con sus detalles de ProductLead
 * @param importCosts - Costos de importación de la orden
 * @param prorationMethod - Método de prorrateo: 'quantity' o 'value'
 * @returns Cálculo completo de costos con breakdown por item
 */
export function calculateOrderCosts(
  orderItems: OrderItemWithProduct[],
  importCosts: ImportCost[],
  prorationMethod: 'quantity' | 'value' = 'value'
): OrderCostCalculation {
  if (orderItems.length === 0) {
    return {
      orderId: '',
      totalFobUsd: 0,
      totalImportCostsUsd: 0,
      totalFinalCostUsd: 0,
      items: [],
      importCosts: []
    }
  }

  const orderId = orderItems[0].orderId

  // Calcular totales FOB
  const totalFobUsd = orderItems.reduce((sum, item) => {
    const discountAmount = (item.discountPercent || 0) / 100 * item.unitPriceUsd
    const finalUnitPrice = item.unitPriceUsd - discountAmount
    return sum + (finalUnitPrice * item.quantity)
  }, 0)

  // Calcular total de costos de importación
  const totalImportCostsUsd = importCosts.reduce((sum, cost) => sum + cost.amountUsd, 0)

  // Calcular pesos para prorrateo
  const totalWeight = prorationMethod === 'quantity' 
    ? orderItems.reduce((sum, item) => sum + item.quantity, 0)
    : totalFobUsd

  // Calcular breakdown por item
  const items: CostBreakdown[] = orderItems.map(item => {
    const discountAmount = (item.discountPercent || 0) / 100 * item.unitPriceUsd
    const unitPriceFobUsd = item.unitPriceUsd - discountAmount
    const totalFobUsd = unitPriceFobUsd * item.quantity

    // Calcular peso del item para prorrateo
    const itemWeight = prorationMethod === 'quantity' 
      ? item.quantity 
      : totalFobUsd

    const weightRatio = totalWeight > 0 ? itemWeight / totalWeight : 0

    // Prorratear costos de importación
    const importCostBreakdown = importCosts.map(cost => {
      const totalAmount = cost.amountUsd * weightRatio
      const amountPerUnit = item.quantity > 0 ? totalAmount / item.quantity : 0
      
      return {
        type: cost.type,
        amountPerUnit,
        totalAmount
      }
    })

    const totalImportCost = importCostBreakdown.reduce((sum, breakdown) => sum + breakdown.totalAmount, 0)
    const importCostPerUnit = item.quantity > 0 ? totalImportCost / item.quantity : 0
    const finalUnitCostUsd = unitPriceFobUsd + importCostPerUnit
    const totalFinalCostUsd = finalUnitCostUsd * item.quantity

    return {
      orderId: item.orderId,
      productLeadId: item.productLeadId,
      productName: item.productLead.name,
      quantity: item.quantity,
      unitPriceFobUsd,
      totalFobUsd,
      importCostPerUnit,
      totalImportCost,
      finalUnitCostUsd,
      totalFinalCostUsd,
      importCostBreakdown
    }
  })

  const totalFinalCostUsd = items.reduce((sum, item) => sum + item.totalFinalCostUsd, 0)

  return {
    orderId,
    totalFobUsd,
    totalImportCostsUsd,
    totalFinalCostUsd,
    items,
    importCosts
  }
}

/**
 * Calcula el costo unitario promedio de un producto específico
 * @param productLeadId - ID del ProductLead
 * @param orderItems - Items de la orden con detalles
 * @param importCosts - Costos de importación
 * @param prorationMethod - Método de prorrateo
 * @returns Costo unitario final del producto
 */
export function calculateProductUnitCost(
  productLeadId: string,
  orderItems: OrderItemWithProduct[],
  importCosts: ImportCost[],
  prorationMethod: 'quantity' | 'value' = 'value'
): number {
  const calculation = calculateOrderCosts(orderItems, importCosts, prorationMethod)
  const productItem = calculation.items.find(item => item.productLeadId === productLeadId)
  return productItem?.finalUnitCostUsd || 0
}

/**
 * Formatea un costo en USD para mostrar en la UI
 * @param amount - Monto a formatear
 * @returns String formateado como moneda USD
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Obtiene el nombre legible del tipo de costo de importación
 * @param type - Tipo de costo desde ImportCostType
 * @returns Nombre legible en español
 */
export function getImportCostTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    flete_internacional: 'Flete Internacional',
    flete_local: 'Flete Local',
    aduana_impuestos: 'Aduana e Impuestos',
    seguro: 'Seguro',
    almacenaje: 'Almacenaje',
    despachante: 'Despachante',
    bancarios: 'Gastos Bancarios',
    otros: 'Otros'
  }
  return typeNames[type] || type
} 