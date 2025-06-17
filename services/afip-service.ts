import { PrismaClient } from '@prisma/client';
import { getAfipClient } from '@/lib/afip/client';
import { mapSaleToAfip, validateSaleForAfip, SaleData } from '@/lib/afip/mappers';
import { AfipResponse } from '@/lib/afip/types';

const prisma = new PrismaClient();

export interface AfipResult {
  success: boolean;
  cae?: string;
  caeExpiry?: string;
  invoiceNumber?: number;
  fullNumber?: string;
  error?: string;
  details?: any;
}

export class AfipService {
  private afipClient = getAfipClient();

  /**
   * Factura una venta existente en AFIP
   */
  async generateInvoiceForSale(saleId: string): Promise<AfipResult> {
    try {
      // Obtener la venta con todos los datos necesarios
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!sale) {
        return {
          success: false,
          error: 'Venta no encontrada'
        };
      }

      if (!sale.isWhiteInvoice) {
        return {
          success: false,
          error: 'La venta no es en blanco, no se puede facturar en AFIP'
        };
      }

      if (sale.authCode) {
        return {
          success: false,
          error: 'La venta ya está facturada en AFIP',
          details: {
            cae: sale.authCode,
            invoiceNumber: sale.invoiceNumber,
            fullNumber: sale.fullNumber
          }
        };
      }

      // Mapear datos al formato esperado por el mapper
      const saleData: SaleData = {
        id: sale.id,
        saleNumber: sale.saleNumber,
        invoiceType: sale.invoiceType,
        pointOfSale: sale.pointOfSale,
        invoiceNumber: sale.invoiceNumber || undefined,
        saleDate: sale.saleDate,
        taxedAmount: sale.taxedAmount,
        nonTaxedAmount: sale.nonTaxedAmount,
        exemptAmount: sale.exemptAmount,
        taxAmount: sale.taxAmount,
        grossIncomePerception: sale.grossIncomePerception,
        total: sale.total,
        customer: {
          customerType: sale.customer.customerType,
          taxId: sale.customer.taxId || ''
        },
        items: sale.items.map(item => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          ivaType: item.ivaType,
          ivaAmount: item.ivaAmount
        }))
      };

      // Validar datos antes de enviar a AFIP
      const validation = validateSaleForAfip(saleData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos inválidos para AFIP',
          details: validation.errors
        };
      }

      // Obtener el siguiente número de factura
      const pointOfSale = parseInt(sale.pointOfSale);
      const voucherType = this.getVoucherTypeFromInvoiceType(sale.invoiceType);
      
      const lastVoucherNumber = await this.afipClient.getLastVoucherNumber(pointOfSale, voucherType);
      const nextInvoiceNumber = lastVoucherNumber + 1;

      // Mapear datos al formato AFIP
      const afipData = mapSaleToAfip(saleData, nextInvoiceNumber);

      console.log('Datos a enviar a AFIP:', JSON.stringify(afipData, null, 2));

      // Llamar a AFIP para generar el CAE
      const afipResponse: AfipResponse = await this.afipClient.createVoucher(afipData);

      // Generar número completo de factura
      const fullNumber = this.generateFullInvoiceNumber(sale.invoiceType, sale.pointOfSale, nextInvoiceNumber);

      // Actualizar la venta con los datos de AFIP
      await prisma.sale.update({
        where: { id: saleId },
        data: {
          invoiceNumber: nextInvoiceNumber,
          fullNumber: fullNumber,
          authCode: afipResponse.CAE,
          authCodeExpiry: new Date(afipResponse.CAEFchVto)
        }
      });

      return {
        success: true,
        cae: afipResponse.CAE,
        caeExpiry: afipResponse.CAEFchVto,
        invoiceNumber: nextInvoiceNumber,
        fullNumber: fullNumber
      };

    } catch (error) {
      console.error('Error en generateInvoiceForSale:', error);
      return {
        success: false,
        error: 'Error al generar factura en AFIP',
        details: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Factura automáticamente una venta al ser creada (si es en blanco)
   */
  async autoInvoice(saleId: string): Promise<AfipResult | null> {
    try {
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        select: { isWhiteInvoice: true, status: true }
      });

      if (!sale || !sale.isWhiteInvoice || sale.status !== 'confirmada') {
        return null; // No auto-facturar
      }

      return await this.generateInvoiceForSale(saleId);
    } catch (error) {
      console.error('Error en auto-facturación:', error);
      return null;
    }
  }

  /**
   * Consulta el estado de una factura en AFIP
   */
  async checkInvoiceStatus(saleId: string): Promise<any> {
    try {
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        select: {
          invoiceNumber: true,
          pointOfSale: true,
          invoiceType: true,
          authCode: true
        }
      });

      if (!sale || !sale.invoiceNumber) {
        throw new Error('Venta no facturada');
      }

      const pointOfSale = parseInt(sale.pointOfSale);
      const voucherType = this.getVoucherTypeFromInvoiceType(sale.invoiceType);

      const afipInfo = await this.afipClient.getVoucherInfo(
        sale.invoiceNumber,
        pointOfSale,
        voucherType
      );

      return afipInfo;
    } catch (error) {
      console.error('Error consultando estado en AFIP:', error);
      throw error;
    }
  }

  /**
   * Obtiene tipos de comprobantes desde AFIP
   */
  async getVoucherTypes(): Promise<any[]> {
    return await this.afipClient.getVoucherTypes();
  }

  /**
   * Verifica el estado del servidor AFIP
   */
  async checkServerStatus(): Promise<any> {
    return await this.afipClient.getServerStatus();
  }

  /**
   * Mapea tipo de factura a código AFIP
   */
  private getVoucherTypeFromInvoiceType(invoiceType: string): number {
    const mapping: { [key: string]: number } = {
      'FACTURA_A': 1,
      'FACTURA_B': 6,
      'FACTURA_C': 11,
      'NOTA_DEBITO_A': 2,
      'NOTA_DEBITO_B': 7,
      'NOTA_DEBITO_C': 12,
      'NOTA_CREDITO_A': 3,
      'NOTA_CREDITO_B': 8,
      'NOTA_CREDITO_C': 13
    };

    return mapping[invoiceType] || 6; // Default a Factura B
  }

  /**
   * Genera el número completo de factura (ej: B-0001-00000123)
   */
  private generateFullInvoiceNumber(invoiceType: string, pointOfSale: string, invoiceNumber: number): string {
    const typePrefix = invoiceType.charAt(invoiceType.length - 1); // A, B, C
    const formattedPointOfSale = pointOfSale.padStart(4, '0');
    const formattedInvoiceNumber = invoiceNumber.toString().padStart(8, '0');
    
    return `${typePrefix}-${formattedPointOfSale}-${formattedInvoiceNumber}`;
  }
}

// Singleton
let afipServiceInstance: AfipService | null = null;

export function getAfipService(): AfipService {
  if (!afipServiceInstance) {
    afipServiceInstance = new AfipService();
  }
  return afipServiceInstance;
} 