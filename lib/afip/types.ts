// Tipos para la integración AFIP

export interface AfipVoucherData {
  CantReg: number;       // Cantidad de comprobantes a registrar
  PtoVta: number;        // Punto de venta
  CbteTipo: number;      // Tipo de comprobante
  Concepto: number;      // Concepto del comprobante
  DocTipo: number;       // Tipo de documento del comprador
  DocNro: number;        // Número de documento del comprador
  CbteDesde: number;     // Número de comprobante desde
  CbteHasta: number;     // Número de comprobante hasta
  CbteFch: number;       // Fecha del comprobante (yyyymmdd)
  ImpTotal: number;      // Importe total del comprobante
  ImpTotConc: number;    // Importe neto no gravado
  ImpNeto: number;       // Importe neto gravado
  ImpOpEx: number;       // Importe exento de IVA
  ImpIVA: number;        // Importe total de IVA
  ImpTrib: number;       // Importe total de tributos
  MonId: string;         // Tipo de moneda
  MonCotiz: number;      // Cotización de la moneda
  Iva?: AfipIvaItem[];   // Alícuotas de IVA
}

export interface AfipIvaItem {
  Id: number;       // Id del tipo de IVA
  BaseImp: number;  // Base imponible
  Importe: number;  // Importe del IVA
}

export interface AfipResponse {
  CAE: string;          // Código de autorización electrónico
  CAEFchVto: string;    // Fecha de vencimiento del CAE
  voucher_number?: number; // Número del comprobante (para createNextVoucher)
}

export interface AfipConfig {
  environment: 'testing' | 'production';
  cuit: string;
  certPath: string;
  keyPath: string;
  passphrase?: string;
}

// Mapeos de nuestro sistema a AFIP
export const AFIP_DOCUMENT_TYPES = {
  responsable_inscripto: 80,    // CUIT
  monotributo: 86,              // CUIL  
  consumidor_final: 99,         // Sin identificar
  exento: 80                    // CUIT
} as const;

export const AFIP_INVOICE_TYPES = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  FACTURA_C: 11,
  NOTA_DEBITO_A: 2,
  NOTA_DEBITO_B: 7,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_A: 3,
  NOTA_CREDITO_B: 8,
  NOTA_CREDITO_C: 13
} as const;

export const AFIP_IVA_TYPES = {
  iva_0: 3,      // 0%
  iva_10_5: 4,   // 10.5%
  iva_21: 5,     // 21%
  iva_27: 6,     // 27%
  exento: 2      // Exento
} as const;

export const AFIP_CONCEPTS = {
  PRODUCTOS: 1,
  SERVICIOS: 2,
  PRODUCTOS_Y_SERVICIOS: 3
} as const;

export type CustomerType = keyof typeof AFIP_DOCUMENT_TYPES;
export type InvoiceType = keyof typeof AFIP_INVOICE_TYPES;
export type IvaType = keyof typeof AFIP_IVA_TYPES; 