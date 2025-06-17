'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, CreditCardIcon, BanknoteIcon, BuildingIcon, QrCodeIcon } from 'lucide-react';
import Link from 'next/link';
import PaymentForm from './payment-form';

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference: string | null;
  status: string;
  notes: string | null;
  customer: {
    id: string;
    businessName: string;
    taxId: string | null;
  };
  sale?: {
    id: string;
    saleNumber: string;
    total: number;
  };
  cheque?: {
    id: string;
    chequeNumber: string;
    bank: string;
    dueDate: string;
    status: string;
    issuer: string;
  };
  cardPayment?: {
    id: string;
    cardType: string;
    cardBrand: string | null;
    lastFourDigits: string | null;
    authCode: string | null;
    installments: number;
    fee: number;
    netAmount: number;
  };
  transfer?: {
    id: string;
    transferType: string;
    reference: string | null;
    bankFrom: string | null;
    bankTo: string | null;
  };
}

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo', icon: BanknoteIcon },
  { value: 'transferencia', label: 'Transferencia', icon: BuildingIcon },
  { value: 'debito', label: 'Tarjeta Débito', icon: CreditCardIcon },
  { value: 'credito', label: 'Tarjeta Crédito', icon: CreditCardIcon },
  { value: 'cheque', label: 'Cheque', icon: CalendarIcon },
  { value: 'qr', label: 'QR/Digital', icon: QrCodeIcon },
  { value: 'cuenta_corriente', label: 'Cuenta Corriente', icon: BuildingIcon }
];

const PAYMENT_STATUS = [
  { value: 'completado', label: 'Completado', variant: 'default' as const },
  { value: 'pendiente', label: 'Pendiente', variant: 'secondary' as const },
  { value: 'rechazado', label: 'Rechazado', variant: 'destructive' as const }
];

const CHEQUE_STATUS = [
  { value: 'recibido', label: 'Recibido', variant: 'secondary' as const },
  { value: 'depositado', label: 'Depositado', variant: 'default' as const },
  { value: 'endosado', label: 'Endosado', variant: 'outline' as const },
  { value: 'rechazado', label: 'Rechazado', variant: 'destructive' as const },
  { value: 'cobrado', label: 'Cobrado', variant: 'default' as const }
];

export default function PaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [filters, setFilters] = useState({
    method: 'all',
    status: 'all',
    customer: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.method && filters.method !== 'all' && { method: filters.method }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.customer && { customerId: filters.customer }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/payments?${params}`);
      if (!response.ok) throw new Error('Error al cargar pagos');
      
      const data = await response.json();
      setPayments(data.payments);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getMethodIcon = (method: string) => {
    const methodConfig = PAYMENT_METHODS.find(m => m.value === method);
    const Icon = methodConfig?.icon || BanknoteIcon;
    return <Icon className="h-4 w-4" />;
  };

  const getMethodLabel = (method: string) => {
    return PAYMENT_METHODS.find(m => m.value === method)?.label || method;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = PAYMENT_STATUS.find(s => s.value === status);
    return (
      <Badge variant={statusConfig?.variant || 'outline'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getChequeStatusBadge = (status: string) => {
    const statusConfig = CHEQUE_STATUS.find(s => s.value === status);
    return (
      <Badge variant={statusConfig?.variant || 'outline'} className="text-xs">
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const renderPaymentDetails = (payment: Payment) => {
    if (payment.method === 'cheque' && payment.cheque) {
      return (
        <div className="text-sm text-gray-600">
          <div>Cheque #{payment.cheque.chequeNumber}</div>
          <div>{payment.cheque.bank} - Vto: {formatDate(payment.cheque.dueDate)}</div>
          <div className="flex items-center gap-2">
            <span>Emisor: {payment.cheque.issuer}</span>
            {getChequeStatusBadge(payment.cheque.status)}
          </div>
        </div>
      );
    }

    if ((payment.method === 'debito' || payment.method === 'credito') && payment.cardPayment) {
      return (
        <div className="text-sm text-gray-600">
          <div>{payment.cardPayment.cardBrand} ****{payment.cardPayment.lastFourDigits}</div>
          {payment.cardPayment.installments > 1 && (
            <div>{payment.cardPayment.installments} cuotas</div>
          )}
          {payment.cardPayment.fee > 0 && (
            <div>Comisión: {formatCurrency(payment.cardPayment.fee)}</div>
          )}
        </div>
      );
    }

    if ((payment.method === 'transferencia' || payment.method === 'qr') && payment.transfer) {
      return (
        <div className="text-sm text-gray-600">
          {payment.transfer.reference && (
            <div>Ref: {payment.transfer.reference}</div>
          )}
          {payment.transfer.bankFrom && (
            <div>Desde: {payment.transfer.bankFrom}</div>
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando pagos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestión de Pagos</span>
            <Button onClick={() => setShowPaymentForm(true)}>
              + Nuevo Pago
            </Button>
          </CardTitle>
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mt-4">
            <Select value={filters.method} onValueChange={(value) => setFilters({...filters, method: value})}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <method.icon className="h-4 w-4" />
                      {method.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {PAYMENT_STATUS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Desde fecha"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="w-40"
            />

            <Input
              placeholder="Hasta fecha"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className="w-40"
            />

            <Button 
              variant="outline" 
              onClick={() => setFilters({method: 'all', status: 'all', customer: '', dateFrom: '', dateTo: ''})}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getMethodIcon(payment.method)}
                      <span className="font-medium">#{payment.paymentNumber}</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </span>
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{payment.customer.businessName}</div>
                        <div className="text-gray-600">
                          {payment.customer.taxId} • {formatDate(payment.paymentDate)}
                        </div>
                        {payment.sale && (
                          <div className="text-blue-600">
                            Venta: #{payment.sale.saleNumber}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="font-medium">{getMethodLabel(payment.method)}</div>
                        {renderPaymentDetails(payment)}
                      </div>
                      
                      <div className="text-right">
                        <Link 
                          href={`/comercializacion/ventas/clientes/${payment.customer.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ver Cliente
                        </Link>
                        {payment.method === 'cheque' && payment.cheque && (
                          <div className="mt-2">
                            <Button size="sm" variant="outline">
                              Gestionar Cheque
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Mostrando {payments.length} de {pagination.total} pagos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                >
                  Anterior
                </Button>
                <span className="px-3 py-1 text-sm">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de nuevo pago */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <PaymentForm
              customerId=""
              amount={0}
              onSuccess={() => {
                setShowPaymentForm(false);
                fetchPayments();
              }}
              onCancel={() => setShowPaymentForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
} 