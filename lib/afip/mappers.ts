import { 
  AfipVoucherData, 
  AfipIvaItem, 
  AFIP_DOCUMENT_TYPES, 
  AFIP_INVOICE_TYPES, 
  AFIP_IVA_TYPES,
  AFIP_CONCEPTS,
  CustomerType,
  InvoiceType,
  IvaType
} from './types';

export interface SaleData {
  id: string;
  saleNumber: string;
  invoiceType: string;
  pointOfSale: string;
  invoiceNumber?: number;
  saleDate: Date;
  taxedAmount: number;
  nonTaxedAmount: number;
  exemptAmount: number;
  taxAmount: number;
  grossIncomePerception: number;
  total: number;
  customer: {
    customerType: string;
    taxId: string;
  };
  items: Array<{
    quantity: number;
    unitPrice: number;
    subtotal: number;
    ivaType: string;
    ivaAmount: number;
  }>;
}

/**
 * Convierte un taxId de nuestro formato (30-12345678-9) a número para AFIP
 */
export function cleanTaxId(taxId: string): number {
  if (!taxId) return 0; // Consumidor final
  
  // Remover guiones y convertir a número
  const cleaned = taxId.replace(/-/g, '');
  return parseInt(cleaned) || 0;
}

/**
 * Convierte fecha a formato AFIP (yyyymmdd)
 */
export function formatDateForAfip(date: Date): number {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return parseInt(`${year}${month}${day}`);
}

/**
 * Mapea el tipo de cliente a código AFIP
 */
export function getAfipDocumentType(customerType: string): number {
  const type = customerType as CustomerType;
  return AFIP_DOCUMENT_TYPES[type] || AFIP_DOCUMENT_TYPES.consumidor_final;
}

/**
 * Mapea el tipo de factura a código AFIP
 */
export function getAfipInvoiceType(invoiceType: string): number {
  const type = invoiceType as InvoiceType;
  return AFIP_INVOICE_TYPES[type] || AFIP_INVOICE_TYPES.FACTURA_B;
}

/**
 * Agrupa los items por tipo de IVA y calcula totales
 */
export function buildIvaArray(items: SaleData['items']): AfipIvaItem[] {
  const ivaMap = new Map<number, { baseImp: number; importe: number }>();
  
  items.forEach(item => {
    const ivaTypeId = AFIP_IVA_TYPES[item.ivaType as IvaType] || AFIP_IVA_TYPES.iva_21;
    
    if (ivaMap.has(ivaTypeId)) {
      const existing = ivaMap.get(ivaTypeId)!;
      existing.baseImp += item.subtotal;
      existing.importe += item.ivaAmount;
    } else {
      ivaMap.set(ivaTypeId, {
        baseImp: item.subtotal,
        importe: item.ivaAmount
      });
    }
  });
  
  // Convertir el Map a array de AfipIvaItem
  return Array.from(ivaMap.entries()).map(([id, data]) => ({
    Id: id,
    BaseImp: Math.round(data.baseImp * 100) / 100, // Redondear a 2 decimales
    Importe: Math.round(data.importe * 100) / 100
  }));
}

/**
 * Convierte una venta de nuestro sistema al formato AFIP
 */
export function mapSaleToAfip(sale: SaleData, nextInvoiceNumber: number): AfipVoucherData {
  return {
    CantReg: 1,
    PtoVta: parseInt(sale.pointOfSale),
    CbteTipo: getAfipInvoiceType(sale.invoiceType),
    Concepto: AFIP_CONCEPTS.PRODUCTOS, // Siempre productos por ahora
    DocTipo: getAfipDocumentType(sale.customer.customerType),
    DocNro: cleanTaxId(sale.customer.taxId),
    CbteDesde: nextInvoiceNumber,
    CbteHasta: nextInvoiceNumber,
    CbteFch: formatDateForAfip(sale.saleDate),
    ImpTotal: Math.round(sale.total * 100) / 100,
    ImpTotConc: Math.round(sale.nonTaxedAmount * 100) / 100,
    ImpNeto: Math.round(sale.taxedAmount * 100) / 100,
    ImpOpEx: Math.round(sale.exemptAmount * 100) / 100,
    ImpIVA: Math.round(sale.taxAmount * 100) / 100,
    ImpTrib: Math.round(sale.grossIncomePerception * 100) / 100,
    MonId: 'PES',
    MonCotiz: 1,
    Iva: buildIvaArray(sale.items)
  };
}

/**
 * Valida que los datos de la venta sean correctos para AFIP
 */
export function validateSaleForAfip(sale: SaleData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar cliente
  if (!sale.customer.customerType) {
    errors.push('Tipo de cliente requerido');
  }
  
  if (sale.customer.customerType !== 'consumidor_final' && !sale.customer.taxId) {
    errors.push('CUIT/CUIL requerido para este tipo de cliente');
  }
  
  // Validar montos
  if (sale.total <= 0) {
    errors.push('El total debe ser mayor a 0');
  }
  
  // Validar que los montos cuadren
  const calculatedTotal = sale.taxedAmount + sale.nonTaxedAmount + sale.exemptAmount + sale.taxAmount + sale.grossIncomePerception;
  const tolerance = 0.01; // Tolerancia de 1 centavo
  
  if (Math.abs(calculatedTotal - sale.total) > tolerance) {
    errors.push(`Los montos no cuadran. Calculado: ${calculatedTotal}, Total: ${sale.total}`);
  }
  
  // Validar punto de venta
  if (!sale.pointOfSale || isNaN(parseInt(sale.pointOfSale))) {
    errors.push('Punto de venta inválido');
  }
  
  // Validar items
  if (!sale.items || sale.items.length === 0) {
    errors.push('La venta debe tener al menos un item');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 