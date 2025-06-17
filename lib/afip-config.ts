import Afip from '@afipsdk/afip.js'
import fs from 'fs'
import path from 'path'

// Configuración de AFIP
export interface AfipConfig {
  CUIT: number
  cert?: string
  key?: string
  production?: boolean
  access_token?: string
  ta_file?: string
}

// Configuración por defecto (modo desarrollo)
const DEFAULT_CONFIG: AfipConfig = {
  CUIT: 20409378472, // CUIT de prueba proporcionado por AFIP SDK
  production: false
}

// Función para cargar certificados desde archivos
export function loadCertificatesFromFiles(certPath: string, keyPath: string): { cert: string, key: string } {
  try {
    const cert = fs.readFileSync(path.resolve(certPath), { encoding: 'utf8' })
    const key = fs.readFileSync(path.resolve(keyPath), { encoding: 'utf8' })
    return { cert, key }
  } catch (error) {
    console.error('Error cargando certificados:', error)
    throw new Error('No se pudieron cargar los certificados de AFIP')
  }
}

// Función para crear instancia de AFIP
export function createAfipInstance(config?: Partial<AfipConfig>): Afip {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  console.log(`🏛️ Inicializando AFIP - CUIT: ${finalConfig.CUIT} - Ambiente: ${finalConfig.production ? 'PRODUCCIÓN' : 'HOMOLOGACIÓN'}`)
  
  return new Afip(finalConfig)
}

// Función para obtener configuración desde variables de entorno
export function getAfipConfigFromEnv(): Partial<AfipConfig> {
  const config: Partial<AfipConfig> = {}
  
  // CUIT desde variable de entorno
  if (process.env.AFIP_CUIT) {
    config.CUIT = parseInt(process.env.AFIP_CUIT)
  }
  
  // Ambiente (producción/homologación)
  if (process.env.AFIP_PRODUCTION) {
    config.production = process.env.AFIP_PRODUCTION === 'true'
  }
  
  // Certificados desde archivos si están especificados
  if (process.env.AFIP_CERT_PATH && process.env.AFIP_KEY_PATH) {
    try {
      const { cert, key } = loadCertificatesFromFiles(
        process.env.AFIP_CERT_PATH,
        process.env.AFIP_KEY_PATH
      )
      config.cert = cert
      config.key = key
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar certificados desde archivos, usando modo desarrollo')
    }
  }
  
  // Certificados desde variables de entorno directamente
  if (process.env.AFIP_CERT && process.env.AFIP_KEY) {
    config.cert = process.env.AFIP_CERT
    config.key = process.env.AFIP_KEY
  }
  
  return config
}

// Instancia global de AFIP (se inicializa con la configuración del entorno)
let afipInstance: Afip | null = null

export function getAfipInstance(): Afip {
  if (!afipInstance) {
    const envConfig = getAfipConfigFromEnv()
    afipInstance = createAfipInstance(envConfig)
  }
  return afipInstance
}

// Tipos para facturación electrónica
export interface AfipInvoiceData {
  // Datos del comprobante
  CbteTipo: number        // Tipo de comprobante (1=Factura A, 6=Factura B, 11=Factura C, etc.)
  PtoVta: number          // Punto de venta
  Concepto: number        // Concepto (1=Productos, 2=Servicios, 3=Productos y Servicios)
  DocTipo: number         // Tipo de documento (80=CUIT, 86=CUIL, 96=DNI, 99=Sin identificar)
  DocNro: number          // Número de documento
  CbteFch: string         // Fecha del comprobante (YYYYMMDD)
  ImpTotal: number        // Importe total
  ImpTotConc: number      // Importe neto no gravado
  ImpNeto: number         // Importe neto gravado
  ImpOpEx: number         // Importe exento
  ImpIVA: number          // Importe de IVA
  ImpTrib: number         // Importe de tributos
  MonId: string           // Moneda (PES=Pesos, DOL=Dólares)
  MonCotiz: number        // Cotización de la moneda
  
  // Arrays opcionales
  Iva?: Array<{
    Id: number            // Tipo de IVA (3=0%, 4=10.5%, 5=21%, 6=27%)
    BaseImp: number       // Base imponible
    Importe: number       // Importe de IVA
  }>
  
  Tributos?: Array<{
    Id: number            // Tipo de tributo
    Desc: string          // Descripción
    BaseImp: number       // Base imponible
    Alic: number          // Alícuota
    Importe: number       // Importe
  }>
}

// Mapeo de tipos de comprobante
export const TIPOS_COMPROBANTE = {
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  RECIBO_A: 4,
  NOTA_VENTA_CONTADO_A: 5,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  RECIBO_B: 9,
  NOTA_VENTA_CONTADO_B: 10,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
  RECIBO_C: 15
} as const

// Mapeo de tipos de documento
export const TIPOS_DOCUMENTO = {
  CUIT: 80,
  CUIL: 86,
  CDI: 87,
  LE: 89,
  LC: 90,
  CI_EXTRANJERA: 91,
  EN_TRAMITE: 92,
  ACTA_NACIMIENTO: 93,
  CI_BS_AS_RN: 95,
  DNI: 96,
  PASAPORTE: 94,
  CI_POLICIA_FEDERAL: 97,
  CI_BUENOS_AIRES: 98,
  SIN_IDENTIFICAR: 99
} as const

// Mapeo de tipos de IVA
export const TIPOS_IVA = {
  NO_GRAVADO: 1,
  EXENTO: 2,
  CERO_PORCIENTO: 3,
  DIEZ_Y_MEDIO_PORCIENTO: 4,
  VEINTIUNO_PORCIENTO: 5,
  VEINTISIETE_PORCIENTO: 6,
  DOS_Y_MEDIO_PORCIENTO: 8,
  CINCO_PORCIENTO: 9
} as const 