import Afip from '@afipsdk/afip.js';
import { AfipConfig } from './types';

export class AfipClient {
  private afip: any;
  private config: AfipConfig;

  constructor(config: AfipConfig) {
    this.config = config;
    this.afip = new Afip({
      CUIT: config.cuit,
      production: config.environment === 'production',
      cert: config.certPath,
      key: config.keyPath,
      passphrase: config.passphrase,
    });
  }

  /**
   * Obtiene el último número de comprobante emitido
   */
  async getLastVoucherNumber(pointOfSale: number, voucherType: number): Promise<number> {
    try {
      const result = await this.afip.ElectronicBilling.getLastVoucher(pointOfSale, voucherType);
      return result || 0;
    } catch (error) {
      console.error('Error obteniendo último comprobante:', error);
      throw new Error(`Error al obtener último comprobante: ${error}`);
    }
  }

  /**
   * Crea un comprobante y obtiene el CAE
   */
  async createVoucher(voucherData: any): Promise<any> {
    try {
      const result = await this.afip.ElectronicBilling.createVoucher(voucherData, false);
      return result;
    } catch (error) {
      console.error('Error creando comprobante en AFIP:', error);
      throw new Error(`Error al crear comprobante en AFIP: ${error}`);
    }
  }

  /**
   * Crea el siguiente comprobante automáticamente
   */
  async createNextVoucher(voucherData: any): Promise<any> {
    try {
      const result = await this.afip.ElectronicBilling.createNextVoucher(voucherData);
      return result;
    } catch (error) {
      console.error('Error creando siguiente comprobante en AFIP:', error);
      throw new Error(`Error al crear siguiente comprobante en AFIP: ${error}`);
    }
  }

  /**
   * Obtiene información de un comprobante ya emitido
   */
  async getVoucherInfo(voucherNumber: number, pointOfSale: number, voucherType: number): Promise<any> {
    try {
      const result = await this.afip.ElectronicBilling.getVoucherInfo(voucherNumber, pointOfSale, voucherType);
      return result;
    } catch (error) {
      console.error('Error obteniendo info del comprobante:', error);
      throw new Error(`Error al obtener información del comprobante: ${error}`);
    }
  }

  /**
   * Obtiene los tipos de comprobantes disponibles
   */
  async getVoucherTypes(): Promise<any[]> {
    try {
      const result = await this.afip.ElectronicBilling.getVoucherTypes();
      return result;
    } catch (error) {
      console.error('Error obteniendo tipos de comprobantes:', error);
      throw new Error(`Error al obtener tipos de comprobantes: ${error}`);
    }
  }

  /**
   * Obtiene los tipos de documentos disponibles
   */
  async getDocumentTypes(): Promise<any[]> {
    try {
      const result = await this.afip.ElectronicBilling.getDocumentTypes();
      return result;
    } catch (error) {
      console.error('Error obteniendo tipos de documentos:', error);
      throw new Error(`Error al obtener tipos de documentos: ${error}`);
    }
  }

  /**
   * Obtiene los tipos de alícuotas disponibles
   */
  async getAliquotTypes(): Promise<any[]> {
    try {
      const result = await this.afip.ElectronicBilling.getAliquotTypes();
      return result;
    } catch (error) {
      console.error('Error obteniendo tipos de alícuotas:', error);
      throw new Error(`Error al obtener tipos de alícuotas: ${error}`);
    }
  }

  /**
   * Verifica el estado del servidor AFIP
   */
  async getServerStatus(): Promise<any> {
    try {
      const result = await this.afip.ElectronicBilling.getServerStatus();
      return result;
    } catch (error) {
      console.error('Error verificando estado del servidor:', error);
      throw new Error(`Error al verificar estado del servidor: ${error}`);
    }
  }

  /**
   * Formatea una fecha del formato AFIP (yyyymmdd) a yyyy-mm-dd
   */
  formatDate(afipDate: string): string {
    return this.afip.ElectronicBilling.formatDate(afipDate);
  }
}

// Singleton para la instancia de AFIP
let afipInstance: AfipClient | null = null;

export function getAfipClient(): AfipClient {
  if (!afipInstance) {
    const config: AfipConfig = {
      environment: (process.env.AFIP_ENVIRONMENT as 'testing' | 'production') || 'testing',
      cuit: process.env.AFIP_CUIT || '20123456789',
      certPath: process.env.AFIP_CERT_PATH || './certs/afip-testing.crt',
      keyPath: process.env.AFIP_KEY_PATH || './certs/afip-testing.key',
      passphrase: process.env.AFIP_PASSPHRASE
    };

    afipInstance = new AfipClient(config);
  }

  return afipInstance;
} 