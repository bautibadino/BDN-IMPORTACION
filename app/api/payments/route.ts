import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, CardType } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Listar pagos con filtros
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/payments - Started');
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const customerId = searchParams.get('customerId');
    const method = searchParams.get('method');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    console.log('GET /api/payments - Filters:', { page, limit, customerId, method, status, dateFrom, dateTo });

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (method && method !== 'all') {
      where.method = method;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) {
        where.paymentDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.paymentDate.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    console.log('GET /api/payments - Where:', where);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              businessName: true,
              taxId: true
            }
          },
          sale: {
            select: {
              id: true,
              saleNumber: true,
              total: true
            }
          },
          cheque: true,
          cardPayment: true,
          transfer: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.payment.count({ where })
    ]);

    console.log('GET /api/payments - Success:', { paymentsCount: payments.length, total });

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Error al obtener los pagos', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo pago
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/payments - Started');
    
    const data = await request.json();
    console.log('POST /api/payments - Data received:', data);
    
    const { 
      customerId, 
      saleId, 
      amount, 
      method, 
      paymentDate, 
      notes, 
      reference,
      chequeData,
      cardData,
      transferData 
    } = data;

    // Validaciones básicas
    if (!customerId || !amount || !method || !paymentDate) {
      console.log('POST /api/payments - Validation failed:', { customerId, amount, method, paymentDate });
      return NextResponse.json(
        { error: 'Datos incompletos: customerId, amount, method y paymentDate son requeridos' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Validaciones específicas por método
    if (method === 'cheque') {
      if (!chequeData?.chequeNumber || !chequeData?.bank || !chequeData?.dueDate || !chequeData?.issuer) {
        console.log('POST /api/payments - Cheque validation failed:', chequeData);
        return NextResponse.json(
          { error: 'Para cheques son requeridos: número, banco, fecha de vencimiento e emisor' },
          { status: 400 }
        );
      }
    }

    console.log('POST /api/payments - Validations passed');

    // Generar número de pago automático
    const lastPayment = await prisma.payment.findFirst({
      orderBy: { paymentNumber: 'desc' }
    });

    let nextNumber = 1;
    if (lastPayment?.paymentNumber) {
      const match = lastPayment.paymentNumber.match(/PAG-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const paymentNumber = `PAG-${nextNumber.toString().padStart(6, '0')}`;
    console.log('POST /api/payments - Payment number generated:', paymentNumber);

    // Iniciar transacción para crear todo de forma atómica
    const result = await prisma.$transaction(async (tx) => {
      // Crear el pago principal
      const paymentCreateData: any = {
        paymentNumber,
        customerId,
        amount,
        method,
        paymentDate: new Date(paymentDate),
        notes: notes || null,
        reference: reference || null,
        status: 'completado'
      };

      if (saleId) {
        paymentCreateData.saleId = saleId;
      }

      console.log('POST /api/payments - Creating payment with data:', paymentCreateData);

      const payment = await tx.payment.create({
        data: paymentCreateData,
        include: {
          customer: true
        }
      });

      console.log('POST /api/payments - Payment created:', payment.id);

      // Crear datos específicos según el método
      if (method === 'cheque' && chequeData) {
        console.log('POST /api/payments - Creating cheque data');
        const cheque = await tx.cheque.create({
          data: {
            chequeNumber: chequeData.chequeNumber,
            bank: chequeData.bank,
            branch: chequeData.branch || null,
            amount: amount,
            issueDate: chequeData.issueDate ? new Date(chequeData.issueDate) : new Date(),
            dueDate: new Date(chequeData.dueDate),
            issuer: chequeData.issuer,
            issuerCuit: chequeData.issuerCuit || null,
            status: 'recibido',
            notes: chequeData.notes || null
          }
        });
        
        // Actualizar el pago con la referencia al cheque
        await tx.payment.update({
          where: { id: payment.id },
          data: { chequeId: cheque.id }
        });
        
        console.log('POST /api/payments - Cheque created and linked:', cheque.id);
      }

      if ((method === 'debito' || method === 'credito') && cardData) {
        console.log('POST /api/payments - Creating card payment data');
        const netAmount = amount - (cardData.fee || 0);
        const cardPayment = await tx.cardPayment.create({
          data: {
            cardType: method as CardType,
            cardBrand: cardData.cardBrand || null,
            lastFourDigits: cardData.lastFourDigits || null,
            authCode: cardData.authCode || null,
            terminalId: cardData.terminalId || null,
            batchNumber: cardData.batchNumber || null,
            installments: cardData.installments || 1,
            fee: cardData.fee || 0,
            netAmount: netAmount,
            notes: cardData.notes || null
          }
        });
        
        // Actualizar el pago con la referencia al cardPayment
        await tx.payment.update({
          where: { id: payment.id },
          data: { cardPaymentId: cardPayment.id }
        });
        
        console.log('POST /api/payments - Card payment created and linked:', cardPayment.id);
      }

      if ((method === 'transferencia' || method === 'qr') && transferData) {
        console.log('POST /api/payments - Creating transfer data');
        const transfer = await tx.transfer.create({
          data: {
            transferType: method === 'qr' ? 'qr' : 'transferencia',
            reference: transferData.reference || null,
            bankFrom: transferData.bankFrom || null,
            bankTo: transferData.bankTo || null,
            accountFrom: transferData.accountFrom || null,
            accountTo: transferData.accountTo || null,
            cvu: transferData.cvu || null,
            alias: transferData.alias || null,
            notes: transferData.notes || null
          }
        });
        
        // Actualizar el pago con la referencia al transfer
        await tx.payment.update({
          where: { id: payment.id },
          data: { transferId: transfer.id }
        });
        
        console.log('POST /api/payments - Transfer created and linked:', transfer.id);
      }

      // Agregar entrada en cuenta corriente (HABER - reduce la deuda del cliente)
      console.log('POST /api/payments - Adding current account entry');
      const lastCurrentAccountItem = await tx.currentAccountItem.findFirst({
        where: { customerId },
        orderBy: { createdAt: 'desc' }
      });

      const previousBalance = lastCurrentAccountItem?.balance || 0;
      const newBalance = previousBalance - amount; // Negativo reduce la deuda

      await tx.currentAccountItem.create({
        data: {
          customerId,
          type: 'haber',
          concept: `Pago ${paymentNumber} - ${method}`,
          amount: amount,
          balance: newBalance,
          paymentId: payment.id,
          date: new Date(paymentDate)
        }
      });

      console.log('POST /api/payments - Current account updated. Previous balance:', previousBalance, 'New balance:', newBalance);

      return payment;
    });

    console.log('POST /api/payments - Transaction completed successfully');

    return NextResponse.json({
      success: true,
      payment: result,
      message: 'Pago registrado exitosamente'
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Error al crear el pago', details: (error as Error).message },
      { status: 500 }
    );
  }
} 