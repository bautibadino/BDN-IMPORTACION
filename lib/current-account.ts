import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CurrentAccountMovement {
  customerId: string
  type: 'debe' | 'haber'
  concept: string
  amount: number
  reference?: string
  date?: Date
  notes?: string
  paymentId?: string
  invoiceId?: string
  saleId?: string
  creditNoteId?: string
}

/**
 * Función centralizada para crear movimientos de cuenta corriente
 * Esta función garantiza que el balance se calcule correctamente
 */
export async function createCurrentAccountMovement(movement: CurrentAccountMovement) {
  // Obtener el último balance del cliente
  const lastItem = await prisma.currentAccountItem.findFirst({
    where: { customerId: movement.customerId },
    orderBy: { createdAt: 'desc' }
  })

  const previousBalance = lastItem?.balance || 0
  
  // Calcular nuevo balance
  // DEBE (+): Aumenta la deuda del cliente (ventas, intereses, etc.)
  // HABER (-): Reduce la deuda del cliente (pagos, notas de crédito, etc.)
  const newBalance = movement.type === 'debe' 
    ? previousBalance + movement.amount 
    : previousBalance - movement.amount

  // Crear el movimiento
  const currentAccountItem = await prisma.currentAccountItem.create({
    data: {
      customerId: movement.customerId,
      type: movement.type,
      concept: movement.concept,
      amount: movement.amount,
      balance: newBalance,
      reference: movement.reference || null,
      notes: movement.notes || null,
      date: movement.date || new Date(),
      paymentId: movement.paymentId || null,
      invoiceId: movement.invoiceId || null,
      creditNoteId: movement.creditNoteId || null
    },
    include: {
      customer: {
        select: {
          businessName: true,
          taxId: true
        }
      }
    }
  })

  return {
    item: currentAccountItem,
    newBalance,
    previousBalance
  }
}

/**
 * Crear movimiento automático para una venta
 */
export async function createSaleMovement(sale: {
  id: string
  saleNumber: string
  customerId: string
  total: number
  saleDate: Date
  isWhiteInvoice: boolean
  status: string
}) {
  // Solo crear movimiento para ventas confirmadas
  if (sale.status !== 'confirmada') {
    return null
  }

  return await createCurrentAccountMovement({
    customerId: sale.customerId,
    type: 'debe',
    concept: `Venta ${sale.saleNumber}`,
    amount: sale.total,
    reference: sale.saleNumber,
    date: sale.saleDate,
    notes: `Venta ${sale.isWhiteInvoice ? 'en blanco' : 'en negro'} - ID: ${sale.id}`,
    saleId: sale.id
  })
}

/**
 * Crear movimiento automático para un pago
 */
export async function createPaymentMovement(payment: {
  id: string
  paymentNumber: string
  customerId: string
  amount: number
  paymentDate: Date
  method: string
  reference?: string
  saleId?: string
}) {
  const saleInfo = payment.saleId ? ` - Venta relacionada` : ''
  
  return await createCurrentAccountMovement({
    customerId: payment.customerId,
    type: 'haber',
    concept: `Pago ${payment.paymentNumber} (${payment.method})`,
    amount: payment.amount,
    reference: payment.paymentNumber,
    date: payment.paymentDate,
    notes: `Método: ${payment.method}${saleInfo}`,
    paymentId: payment.id
  })
}

/**
 * Obtener el balance actual de un cliente
 */
export async function getCurrentBalance(customerId: string): Promise<number> {
  const lastItem = await prisma.currentAccountItem.findFirst({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    select: { balance: true }
  })

  return lastItem?.balance || 0
}

/**
 * Obtener el estado completo de cuenta corriente de un cliente
 */
export async function getCustomerAccountStatement(customerId: string, limit = 50) {
  const [items, currentBalance] = await Promise.all([
    prisma.currentAccountItem.findMany({
      where: { customerId },
      include: {
        payment: {
          select: {
            paymentNumber: true,
            method: true
          }
        },
        invoice: {
          select: {
            invoiceNumber: true,
            invoiceType: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: limit
    }),
    getCurrentBalance(customerId)
  ])

  return {
    items,
    currentBalance,
    isInDebt: currentBalance > 0,
    isInCredit: currentBalance < 0
  }
}

/**
 * Recalcular balances de cuenta corriente (función de mantenimiento)
 * Útil para corregir inconsistencias
 */
export async function recalculateBalances(customerId: string) {
  const items = await prisma.currentAccountItem.findMany({
    where: { customerId },
    orderBy: { createdAt: 'asc' }
  })

  let balance = 0
  
  for (const item of items) {
    balance = item.type === 'debe' 
      ? balance + item.amount 
      : balance - item.amount

    await prisma.currentAccountItem.update({
      where: { id: item.id },
      data: { balance }
    })
  }

  return balance
} 