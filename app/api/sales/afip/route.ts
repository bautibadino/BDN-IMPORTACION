import { NextRequest, NextResponse } from 'next/server';
import { getAfipService } from '@/services/afip-service';

export async function POST(request: NextRequest) {
  try {
    const { saleId } = await request.json();
    
    if (!saleId) {
      return NextResponse.json(
        { error: 'ID de venta requerido' },
        { status: 400 }
      );
    }

    const afipService = getAfipService();
    const result = await afipService.generateInvoiceForSale(saleId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Factura generada exitosamente en AFIP',
      data: {
        cae: result.cae,
        caeExpiry: result.caeExpiry,
        invoiceNumber: result.invoiceNumber,
        fullNumber: result.fullNumber
      }
    });

  } catch (error) {
    console.error('Error en API AFIP:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('saleId');
    const action = searchParams.get('action');

    const afipService = getAfipService();

    if (action === 'status') {
      if (!saleId) {
        return NextResponse.json(
          { error: 'ID de venta requerido para consultar estado' },
          { status: 400 }
        );
      }

      const status = await afipService.checkInvoiceStatus(saleId);
      return NextResponse.json({ status });
    }

    if (action === 'server-status') {
      const serverStatus = await afipService.checkServerStatus();
      return NextResponse.json({ serverStatus });
    }

    if (action === 'voucher-types') {
      const voucherTypes = await afipService.getVoucherTypes();
      return NextResponse.json({ voucherTypes });
    }

    return NextResponse.json(
      { error: 'Acción no válida. Use: status, server-status, voucher-types' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en API AFIP GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 