'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, CreditCardIcon, BanknoteIcon, BuildingIcon, QrCodeIcon } from 'lucide-react';

interface PaymentFormProps {
  customerId?: string;
  saleId?: string;
  amount?: number;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

interface Customer {
  id: string;
  businessName: string;
  taxId: string | null;
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

export default function PaymentForm({ customerId = '', saleId, amount = 0, onSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [method, setMethod] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(customerId);
  
  const [paymentData, setPaymentData] = useState({
    amount: amount,
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    reference: ''
  });

  const isPartialPayment = paymentData.amount < amount && paymentData.amount > 0;
  const remainingAmount = amount - paymentData.amount;

  // Datos específicos por tipo de pago
  const [chequeData, setChequeData] = useState({
    chequeNumber: '',
    bank: '',
    branch: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    issuer: '',
    issuerCuit: '',
    notes: ''
  });

  const [cardData, setCardData] = useState({
    cardBrand: '',
    lastFourDigits: '',
    authCode: '',
    terminalId: '',
    batchNumber: '',
    installments: 1,
    fee: 0,
    notes: ''
  });

  const [transferData, setTransferData] = useState({
    bankFrom: '',
    bankTo: '',
    accountFrom: '',
    accountTo: '',
    reference: '',
    cvu: '',
    alias: '',
    notes: ''
  });

  // Cargar lista de clientes
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      }
    };

    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!method) {
      alert('Debe seleccionar un método de pago');
      return;
    }

    if (!selectedCustomer) {
      alert('Debe seleccionar un cliente');
      return;
    }

    if (paymentData.amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    
    try {
      const payload: any = {
        customerId: selectedCustomer,
        saleId,
        amount: paymentData.amount,
        method,
        paymentDate: paymentData.paymentDate,
        notes: paymentData.notes,
        reference: paymentData.reference
      };

      // Agregar datos específicos según el método
      if (method === 'cheque') {
        payload.chequeData = chequeData;
      } else if (method === 'debito' || method === 'credito') {
        payload.cardData = cardData;
      } else if (method === 'transferencia' || method === 'qr') {
        payload.transferData = transferData;
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error al procesar el pago');
      }

      const data = await response.json();
      alert('Pago registrado exitosamente');
      onSuccess(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const renderMethodSpecificFields = () => {
    switch (method) {
      case 'cheque':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chequeNumber">Número de Cheque *</Label>
              <Input
                id="chequeNumber"
                value={chequeData.chequeNumber}
                onChange={(e) => setChequeData({...chequeData, chequeNumber: e.target.value})}
                required
                placeholder="123456"
              />
            </div>
            <div>
              <Label htmlFor="bank">Banco *</Label>
              <Select value={chequeData.bank} onValueChange={(value) => setChequeData({...chequeData, bank: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banco_nacion">Banco Nación</SelectItem>
                  <SelectItem value="banco_provincia">Banco Provincia</SelectItem>
                  <SelectItem value="banco_ciudad">Banco Ciudad</SelectItem>
                  <SelectItem value="santander">Santander</SelectItem>
                  <SelectItem value="galicia">Galicia</SelectItem>
                  <SelectItem value="bbva">BBVA</SelectItem>
                  <SelectItem value="macro">Macro</SelectItem>
                  <SelectItem value="supervielle">Supervielle</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branch">Sucursal</Label>
              <Input
                id="branch"
                value={chequeData.branch}
                onChange={(e) => setChequeData({...chequeData, branch: e.target.value})}
                placeholder="Central, Microcentro, etc."
              />
            </div>
            <div>
              <Label htmlFor="issuer">Emisor del Cheque *</Label>
              <Input
                id="issuer"
                value={chequeData.issuer}
                onChange={(e) => setChequeData({...chequeData, issuer: e.target.value})}
                required
                placeholder="Nombre de quien firma el cheque"
              />
            </div>
            <div>
              <Label htmlFor="issuerCuit">CUIT del Emisor</Label>
              <Input
                id="issuerCuit"
                value={chequeData.issuerCuit}
                onChange={(e) => setChequeData({...chequeData, issuerCuit: e.target.value})}
                placeholder="20-12345678-9"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Fecha de Vencimiento *</Label>
              <Input
                id="dueDate"
                type="date"
                value={chequeData.dueDate}
                onChange={(e) => setChequeData({...chequeData, dueDate: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="issueDate">Fecha de Emisión</Label>
              <Input
                id="issueDate"
                type="date"
                value={chequeData.issueDate}
                onChange={(e) => setChequeData({...chequeData, issueDate: e.target.value})}
              />
            </div>
          </div>
        );

      case 'debito':
      case 'credito':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cardBrand">Marca de Tarjeta</Label>
              <Select value={cardData.cardBrand} onValueChange={(value) => setCardData({...cardData, cardBrand: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="amex">American Express</SelectItem>
                  <SelectItem value="cabal">Cabal</SelectItem>
                  <SelectItem value="naranja">Naranja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lastFourDigits">Últimos 4 dígitos</Label>
              <Input
                id="lastFourDigits"
                value={cardData.lastFourDigits}
                onChange={(e) => setCardData({...cardData, lastFourDigits: e.target.value})}
                maxLength={4}
                placeholder="1234"
              />
            </div>
            <div>
              <Label htmlFor="authCode">Código de Autorización</Label>
              <Input
                id="authCode"
                value={cardData.authCode}
                onChange={(e) => setCardData({...cardData, authCode: e.target.value})}
                placeholder="123456"
              />
            </div>
            <div>
              <Label htmlFor="terminalId">ID Terminal</Label>
              <Input
                id="terminalId"
                value={cardData.terminalId}
                onChange={(e) => setCardData({...cardData, terminalId: e.target.value})}
                placeholder="12345678"
              />
            </div>
            {method === 'credito' && (
              <div>
                <Label htmlFor="installments">Cuotas</Label>
                <Select 
                  value={cardData.installments.toString()} 
                  onValueChange={(value) => setCardData({...cardData, installments: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,6,9,12,18,24].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} cuota{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="fee">Comisión ($)</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                value={cardData.fee}
                onChange={(e) => setCardData({...cardData, fee: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
        );

      case 'transferencia':
      case 'qr':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference">Referencia/Código de Operación</Label>
              <Input
                id="reference"
                value={transferData.reference}
                onChange={(e) => setTransferData({...transferData, reference: e.target.value})}
                placeholder="123456789"
              />
            </div>
            <div>
              <Label htmlFor="bankFrom">Banco Origen</Label>
              <Input
                id="bankFrom"
                value={transferData.bankFrom}
                onChange={(e) => setTransferData({...transferData, bankFrom: e.target.value})}
                placeholder="Banco Nación"
              />
            </div>
            <div>
              <Label htmlFor="cvu">CVU</Label>
              <Input
                id="cvu"
                value={transferData.cvu}
                onChange={(e) => setTransferData({...transferData, cvu: e.target.value})}
                placeholder="0000003100010000000001"
              />
            </div>
            <div>
              <Label htmlFor="alias">Alias</Label>
              <Input
                id="alias"
                value={transferData.alias}
                onChange={(e) => setTransferData({...transferData, alias: e.target.value})}
                placeholder="EMPRESA.CUENTA.MP"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Registrar Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente y datos básicos del pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Cliente *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.businessName} {customer.taxId && `(${customer.taxId})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="method">Método de Pago *</Label>
              <Select value={method} onValueChange={setMethod} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(methodOption => (
                    <SelectItem key={methodOption.value} value={methodOption.value}>
                      <div className="flex items-center gap-2">
                        <methodOption.icon className="h-4 w-4" />
                        {methodOption.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})}
                required
                min="0.01"
                max={amount}
              />
              {amount > 0 && (
                <div className="mt-2 text-sm">
                  <p className="text-gray-600">Total de la venta: <span className="font-medium">${amount.toFixed(2)}</span></p>
                  {isPartialPayment && (
                    <p className="text-orange-600">
                      Pago parcial - Restante: <span className="font-medium">${remainingAmount.toFixed(2)}</span>
                    </p>
                  )}
                  {paymentData.amount === amount && (
                    <p className="text-green-600">✓ Pago completo</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="paymentDate">Fecha de Pago *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Campos específicos por método */}
          {method && (
            <div>
              <h3 className="text-lg font-medium mb-4">
                Detalles del {PAYMENT_METHODS.find(m => m.value === method)?.label}
              </h3>
              {renderMethodSpecificFields()}
            </div>
          )}

          {/* Notas generales */}
          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !method || !selectedCustomer}>
              {loading ? 'Procesando...' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 