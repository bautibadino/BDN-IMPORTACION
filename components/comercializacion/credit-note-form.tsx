'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, AlertTriangle, FileText } from 'lucide-react';

interface Customer {
  id: string;
  businessName: string;
  contactName?: string;
  taxId?: string;
  customerType: string;
}

interface Product {
  id: string;
  name: string;
  internalCode?: string;
  finalPriceArs: number;
  ivaType: string;
  stock: number;
}

interface Sale {
  id: string;
  saleNumber: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  saleDate: string;
  customerId: string;
  customer?: Customer;
  items: SaleItem[];
}

interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  description: string;
  ivaType: string;
  ivaAmount: number;
  product: Product;
}

interface CreditNoteFormProps {
  originalSale?: Sale;
  onSuccess: (creditNote: any) => void;
  onCancel: () => void;
}

const CREDIT_NOTE_REASONS = [
  { value: 'devolucion', label: 'Devolución de mercadería' },
  { value: 'descuento', label: 'Descuento o bonificación' },
  { value: 'error_facturacion', label: 'Error en facturación' },
  { value: 'anulacion', label: 'Anulación de venta' },
  { value: 'ajuste_precio', label: 'Ajuste de precio' },
  { value: 'garantia', label: 'Garantía' },
  { value: 'otros', label: 'Otros motivos' }
];

const IVA_RATES = {
  'exento': 0,
  'iva_10_5': 10.5,
  'iva_21': 21,
  'iva_27': 27
};

export default function CreditNoteForm({ originalSale, onSuccess, onCancel }: CreditNoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Datos básicos de la nota
  const [formData, setFormData] = useState({
    customerId: originalSale?.id ? '' : '', // Se llenará cuando se cargue la venta
    originalSaleId: originalSale?.id || '',
    reason: '',
    description: '',
    notes: ''
  });

  // Items de la nota de crédito
  const [items, setItems] = useState<any[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, productsRes, salesRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/products'),
          fetch('/api/sales')
        ]);

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData);
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }

        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setSales(salesData.sales || []);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    fetchData();
  }, []);

  // Función para cargar productos de una venta seleccionada
  const loadSaleItems = async (saleId: string) => {
    if (!saleId) {
      // Si no hay venta seleccionada, limpiar items y poner uno vacío para agregar manualmente
      setItems([{
        productId: '',
        product: null,
        quantity: 1,
        maxQuantity: null,
        unitPrice: 0,
        subtotal: 0,
        description: '',
        ivaType: 'iva_21',
        ivaAmount: 0,
        totalAmount: 0
      }]);
      return;
    }

    try {
      // Verificar si ya existe una nota de crédito para esta venta
      const creditNotesResponse = await fetch(`/api/credit-notes?originalSaleId=${saleId}`);
      if (creditNotesResponse.ok) {
        const creditNotesData = await creditNotesResponse.json();
        const existingCreditNote = creditNotesData.creditNotes?.find((cn: any) => 
          cn.originalSaleId === saleId && cn.status !== 'anulada'
        );
        
        if (existingCreditNote) {
          alert(`Ya existe una nota de crédito (${existingCreditNote.creditNoteNumber}) para esta venta. Solo se permite una nota de crédito por venta.`);
          // Limpiar la selección
          setFormData(prev => ({ ...prev, originalSaleId: '' }));
          return;
        }
      }

      // Buscar la venta en las ventas cargadas
      let selectedSale = sales.find(s => s.id === saleId);
      
      // Si no está en la lista, cargarla desde la API
      if (!selectedSale) {
        const response = await fetch(`/api/sales/${saleId}`);
        if (response.ok) {
          selectedSale = await response.json();
        }
      }

      if (selectedSale) {
        // Actualizar el customerId automáticamente
        setFormData(prev => ({
          ...prev,
          customerId: selectedSale.customerId
        }));

        // Cargar todos los productos de la venta con cantidad 0 inicialmente
        // El usuario deberá especificar cuánto quiere creditar de cada producto
        const saleItems = selectedSale.items.map(item => {
          // Calcular valores con cantidad 0 para mostrar estructura completa
          const quantity = 0;
          const subtotal = quantity * item.unitPrice;
          const ivaRate = IVA_RATES[item.ivaType as keyof typeof IVA_RATES] || 0;
          const ivaAmount = subtotal * (ivaRate / 100);
          const totalAmount = subtotal + ivaAmount;

          return {
            productId: item.productId,
            product: item.product,
            quantity: quantity,
            maxQuantity: item.quantity, // Máximo que se puede creditar
            unitPrice: item.unitPrice,
            subtotal: subtotal,
            description: item.description || item.product.name,
            ivaType: item.ivaType,
            ivaAmount: ivaAmount,
            totalAmount: totalAmount,
            originalSaleItem: item, // Referencia al item original para validaciones
            isFromSale: true // Marcar que viene de una venta para diferenciarlo visualmente
          };
        });

        setItems(saleItems);
      }
    } catch (error) {
      console.error('Error al cargar items de la venta:', error);
      alert('Error al cargar los productos de la venta seleccionada');
    }
  };

  // Si hay una venta original, cargar sus datos
  useEffect(() => {
    if (originalSale) {
      setFormData(prev => ({
        ...prev,
        customerId: originalSale.customerId || '',
        originalSaleId: originalSale.id
      }));

      // Cargar items de la venta original para facilitar la creación de la nota
      const saleItems = originalSale.items.map(item => {
        // Calcular valores con cantidad 0 para mostrar estructura completa
        const quantity = 0;
        const subtotal = quantity * item.unitPrice;
        const ivaRate = IVA_RATES[item.ivaType as keyof typeof IVA_RATES] || 0;
        const ivaAmount = subtotal * (ivaRate / 100);
        const totalAmount = subtotal + ivaAmount;

        return {
          productId: item.productId,
          product: item.product,
          quantity: quantity,
          maxQuantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: subtotal,
          description: item.description || item.product.name,
          ivaType: item.ivaType,
          ivaAmount: ivaAmount,
          totalAmount: totalAmount,
          originalSaleItem: item,
          isFromSale: true // Marcar que viene de una venta
        };
      });

      setItems(saleItems);
    } else {
      // Inicializar con un item vacío para modo manual
      setItems([{
        productId: '',
        product: null,
        quantity: 1,
        maxQuantity: null,
        unitPrice: 0,
        subtotal: 0,
        description: '',
        ivaType: 'iva_21',
        ivaAmount: 0,
        totalAmount: 0
      }]);
    }
  }, [originalSale]);

  const addItem = () => {
    setItems([...items, {
      productId: '',
      product: null,
      quantity: 1,
      maxQuantity: null,
      unitPrice: 0,
      subtotal: 0,
      description: '',
      ivaType: 'iva_21',
      ivaAmount: 0,
      totalAmount: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Si se seleccionó un producto, cargar sus datos
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].product = product;
        newItems[index].unitPrice = product.finalPriceArs;
        newItems[index].description = product.name;
        newItems[index].ivaType = product.ivaType;
      }
    }

    // Recalcular totales cuando cambie cantidad o precio
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      const unitPrice = field === 'unitPrice' ? value : newItems[index].unitPrice;
      
      const subtotal = quantity * unitPrice;
      const ivaRate = IVA_RATES[newItems[index].ivaType as keyof typeof IVA_RATES] || 0;
      const ivaAmount = subtotal * (ivaRate / 100);
      const totalAmount = subtotal + ivaAmount;

      newItems[index].subtotal = subtotal;
      newItems[index].ivaAmount = ivaAmount;
      newItems[index].totalAmount = totalAmount;
    }

    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.ivaAmount || 0), 0);
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.reason || !formData.description) {
      alert('Debe completar todos los campos obligatorios');
      return;
    }

    if (items.length === 0 || items.every(item => item.quantity <= 0)) {
      alert('Debe agregar al menos un item con cantidad mayor a 0');
      return;
    }

    // Validar cantidades máximas si es una devolución
    if (originalSale && formData.reason === 'devolucion') {
      for (const item of items) {
        if (item.maxQuantity && item.quantity > item.maxQuantity) {
          alert(`La cantidad a devolver no puede ser mayor a la cantidad vendida (${item.maxQuantity})`);
          return;
        }
      }
    }

    setLoading(true);
    
    try {
      const validItems = items.filter(item => item.quantity > 0);
      
      const payload = {
        ...formData,
        items: validItems.map(item => ({
          productId: item.productId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          description: item.description,
          ivaType: item.ivaType,
          ivaAmount: item.ivaAmount,
          totalAmount: item.totalAmount
        }))
      };

      const response = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la nota de crédito');
      }

      const data = await response.json();
      alert('Nota de crédito creada exitosamente');
      onSuccess(data);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al crear la nota de crédito');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Nueva Nota de Crédito
          {originalSale && (
            <Badge variant="outline">
              Basada en venta {originalSale.saleNumber}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Cliente *</Label>
              <Select 
                value={formData.customerId} 
                onValueChange={(value) => setFormData({...formData, customerId: value})}
                required
              >
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

            {!originalSale && (
              <div>
                <Label htmlFor="originalSale">Venta Original (opcional)</Label>
                <Select 
                  value={formData.originalSaleId || 'none'} 
                  onValueChange={(value) => {
                    const actualValue = value === 'none' ? '' : value;
                    setFormData({...formData, originalSaleId: actualValue});
                    loadSaleItems(actualValue);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar venta para cargar productos automáticamente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna (agregar productos manualmente)</SelectItem>
                    {sales
                      .filter(sale => !formData.customerId || sale.customerId === formData.customerId)
                      .map(sale => (
                        <SelectItem key={sale.id} value={sale.id}>
                          {sale.saleNumber} - ${sale.total.toFixed(2)} - {sale.customer?.businessName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formData.originalSaleId && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-700">
                      ✓ <strong>Productos cargados automáticamente</strong> con cantidad 0
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      • Especifica las cantidades a creditar para cada producto
                    </p>
                    <p className="text-xs text-green-600">
                      • Solo se permite una nota de crédito por venta
                    </p>
                  </div>
                )}
                {!formData.originalSaleId && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Puedes agregar productos manualmente o seleccionar una venta para cargar sus productos automáticamente.
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="reason">Motivo *</Label>
              <Select 
                value={formData.reason} 
                onValueChange={(value) => setFormData({...formData, reason: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar motivo" />
                </SelectTrigger>
                <SelectContent>
                  {CREDIT_NOTE_REASONS.map(reason => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción del motivo de la nota"
                required
              />
            </div>
          </div>

          {/* Cliente seleccionado info */}
          {selectedCustomer && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Cliente:</strong> {selectedCustomer.businessName} 
                {selectedCustomer.taxId && ` - CUIT: ${selectedCustomer.taxId}`}
                <br />
                <strong>Tipo:</strong> {selectedCustomer.customerType.replace('_', ' ')}
              </p>
            </div>
          )}

          {/* Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Items de la Nota de Crédito</h3>
                {formData.originalSaleId && (
                  <p className="text-sm text-gray-600">
                    Productos de la venta {sales.find(s => s.id === formData.originalSaleId)?.saleNumber}
                  </p>
                )}
                {!formData.originalSaleId && (
                  <p className="text-sm text-gray-600">
                    Productos agregados manualmente
                  </p>
                )}
              </div>
                             <div className="flex gap-2">
                 {formData.originalSaleId && (
                   <>
                     <Button 
                       type="button" 
                       onClick={() => {
                         // Cargar cantidades completas para devolución total y recalcular totales
                         const newItems = items.map(item => {
                           if (item.maxQuantity) {
                             const quantity = item.maxQuantity;
                             const subtotal = quantity * item.unitPrice;
                             const ivaRate = IVA_RATES[item.ivaType as keyof typeof IVA_RATES] || 0;
                             const ivaAmount = subtotal * (ivaRate / 100);
                             const totalAmount = subtotal + ivaAmount;

                             return {
                               ...item,
                               quantity: quantity,
                               subtotal: subtotal,
                               ivaAmount: ivaAmount,
                               totalAmount: totalAmount
                             };
                           }
                           return item;
                         });
                         setItems(newItems);
                       }} 
                       variant="secondary"
                       size="sm"
                     >
                       Devolución Completa
                     </Button>
                     <Button 
                       type="button" 
                       onClick={() => {
                         setFormData({...formData, originalSaleId: ''});
                         loadSaleItems('');
                       }} 
                       variant="outline"
                       size="sm"
                     >
                       Limpiar y Agregar Manual
                     </Button>
                   </>
                 )}
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Item Manual
                </Button>
               </div>
            </div>

            {items.map((item, index) => (
              <Card key={index} className={`p-4 ${item.maxQuantity ? 'border-blue-200 bg-blue-50' : ''}`}>
                {item.maxQuantity && (
                  <div className="mb-2">
                    <Badge variant="outline" className="text-blue-700 border-blue-300">
                      Producto de venta original (máx: {item.maxQuantity})
                    </Badge>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="md:col-span-2">
                    <Label>Producto</Label>
                    <Select 
                      value={item.productId} 
                      onValueChange={(value) => updateItem(index, 'productId', value)}
                      disabled={!!item.maxQuantity} // Deshabilitar si viene de venta original
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${product.finalPriceArs.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {item.maxQuantity && (
                      <p className="text-xs text-blue-600 mt-1">
                        Producto de venta {sales.find(s => s.id === formData.originalSaleId)?.saleNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="0"
                      max={item.maxQuantity || undefined}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                    {item.maxQuantity && (
                      <p className="text-xs text-gray-500 mt-1">
                        Máximo: {item.maxQuantity}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Precio Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Label>Subtotal</Label>
                    <Input
                      value={`$${item.subtotal.toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="flex gap-2">
                    {item.maxQuantity ? (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateItem(index, 'quantity', 0)}
                        title="Limpiar cantidad (no eliminar producto de venta original)"
                      >
                        Limpiar
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        title="Eliminar producto manual"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <Label>Descripción</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Descripción del item"
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Totales */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-right">
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="text-lg font-medium">${subtotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">IVA</p>
                <p className="text-lg font-medium">${taxAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold text-green-600">${total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Notas adicionales */}
          <div>
            <Label htmlFor="notes">Notas Internas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Notas internas adicionales..."
            />
          </div>

          {/* Advertencias */}
          {formData.reason === 'devolucion' && (
            <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Nota sobre devoluciones:</p>
                <p>El stock de los productos será restaurado automáticamente al generar esta nota de crédito.</p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Generando...' : 'Generar Nota de Crédito'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 