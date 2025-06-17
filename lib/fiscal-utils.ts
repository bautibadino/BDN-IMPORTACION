import { IVAType, InvoiceType, CustomerType } from '@prisma/client'

// Porcentajes de IVA según tipo
export const IVA_RATES: Record<IVAType, number> = {
  iva_21: 0.21,
  iva_10_5: 0.105,
  iva_27: 0.27,
  iva_5: 0.05,
  iva_2_5: 0.025,
  no_gravado: 0,
  exento: 0,
}

// Nombres legibles de tipos de IVA
export const IVA_NAMES: Record<IVAType, string> = {
  iva_21: 'IVA 21%',
  iva_10_5: 'IVA 10.5%',
  iva_27: 'IVA 27%',
  iva_5: 'IVA 5%',
  iva_2_5: 'IVA 2.5%',
  no_gravado: 'No Gravado',
  exento: 'Exento',
}

// Tipos de factura según tipo de cliente
export const INVOICE_TYPE_BY_CUSTOMER: Record<CustomerType, InvoiceType> = {
  responsable_inscripto: InvoiceType.FACTURA_A,
  monotributo: InvoiceType.FACTURA_B,
  consumidor_final: InvoiceType.FACTURA_B,
  exento: InvoiceType.FACTURA_B,
}

// Calcular IVA de un monto
export function calculateIVA(amount: number, ivaType: IVAType): number {
  const rate = IVA_RATES[ivaType]
  return Math.round(amount * rate * 100) / 100
}

// Calcular precio con IVA
export function calculatePriceWithIVA(basePrice: number, ivaType: IVAType): number {
  const ivaAmount = calculateIVA(basePrice, ivaType)
  return basePrice + ivaAmount
}

// Discriminar montos para AFIP según tipos de IVA de los items
export interface SaleItemForCalculation {
  subtotal: number
  ivaType: IVAType
  ivaAmount: number
}

export interface FiscalAmounts {
  taxedAmount: number      // Monto gravado (base para IVA)
  nonTaxedAmount: number   // Monto no gravado
  exemptAmount: number     // Monto exento
  taxAmount: number        // IVA total
  total: number           // Total general
}

export function calculateFiscalAmounts(items: SaleItemForCalculation[]): FiscalAmounts {
  let taxedAmount = 0
  let nonTaxedAmount = 0
  let exemptAmount = 0
  let taxAmount = 0

  items.forEach(item => {
    switch (item.ivaType) {
      case 'iva_21':
      case 'iva_10_5':
      case 'iva_27':
      case 'iva_5':
      case 'iva_2_5':
        taxedAmount += item.subtotal
        taxAmount += item.ivaAmount
        break
      case 'no_gravado':
        nonTaxedAmount += item.subtotal
        break
      case 'exento':
        exemptAmount += item.subtotal
        break
    }
  })

  // Redondear a 2 decimales
  taxedAmount = Math.round(taxedAmount * 100) / 100
  nonTaxedAmount = Math.round(nonTaxedAmount * 100) / 100
  exemptAmount = Math.round(exemptAmount * 100) / 100
  taxAmount = Math.round(taxAmount * 100) / 100

  const total = taxedAmount + nonTaxedAmount + exemptAmount + taxAmount

  return {
    taxedAmount,
    nonTaxedAmount,
    exemptAmount,
    taxAmount,
    total: Math.round(total * 100) / 100
  }
}

// Determinar tipo de factura según cliente
export function getInvoiceTypeForCustomer(customerType: CustomerType): InvoiceType {
  return INVOICE_TYPE_BY_CUSTOMER[customerType]
}

// Generar número completo de factura
export function generateFullInvoiceNumber(
  invoiceType: InvoiceType,
  pointOfSale: string,
  invoiceNumber: number
): string {
  const typePrefix = invoiceType.split('_')[1] // A, B, C, E
  const formattedNumber = invoiceNumber.toString().padStart(8, '0')
  return `${typePrefix}-${pointOfSale}-${formattedNumber}`
}

// Validar CUIT/CUIL
export function validateCUIT(cuit: string): boolean {
  // Remover guiones y espacios
  const cleanCuit = cuit.replace(/[-\s]/g, '')
  
  // Debe tener 11 dígitos
  if (!/^\d{11}$/.test(cleanCuit)) {
    return false
  }

  // Validación del dígito verificador
  const digits = cleanCuit.split('').map(Number)
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * multipliers[i]
  }
  
  let verificationDigit = 11 - (sum % 11)
  if (verificationDigit === 11) verificationDigit = 0
  if (verificationDigit === 10) verificationDigit = 9
  
  return verificationDigit === digits[10]
}

// Formatear CUIT para mostrar
export function formatCUIT(cuit: string): string {
  const cleanCuit = cuit.replace(/[-\s]/g, '')
  if (cleanCuit.length === 11) {
    return `${cleanCuit.slice(0, 2)}-${cleanCuit.slice(2, 10)}-${cleanCuit.slice(10)}`
  }
  return cuit
} 