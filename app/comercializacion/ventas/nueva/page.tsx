'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, ShoppingCart, Plus, Trash2, Calculator } from "lucide-react"
import Link from 'next/link'
import { toast } from 'sonner'
import { CustomerSelector } from '@/components/comercializacion/customer-selector'
import { ProductSelector } from '@/components/comercializacion/product-selector'
import { calculateIVA, calculateFiscalAmounts, getInvoiceTypeForCustomer, IVA_NAMES } from '@/lib/fiscal-utils'
import PaymentForm from '@/components/comercializacion/payment-form'

interface SaleItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
  description?: string
  ivaType: string
  ivaAmount: number
  totalAmount: number
}

interface Customer {
  id: string
  businessName: string
  contactName?: string
  taxId?: string
  customerType: string
  discount?: number
}

interface Product {
  id: string
  name: string
  internalCode?: string
  finalPriceArs: number
  stock: number
  location?: string
  ivaType: string
  unit?: string
}

export default function NuevaVentaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [createdSale, setCreatedSale] = useState<any>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<SaleItem[]>([])
  const [showQuoteSelector, setShowQuoteSelector] = useState(false)
  const [availableQuotes, setAvailableQuotes] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    customerId: '',
    status: 'confirmada' as const,
    isWhiteInvoice: true, // Por defecto en blanco
    saleDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    notes: '',
    internalNotes: '',
    quoteId: ''
  })

  // Cargar productos disponibles
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        }
      } catch (error) {
        console.error('Error cargando productos:', error)
      }
    }
    
    fetchProducts()
  }, [])

  // Calcular totales usando las funciones fiscales
  const fiscalAmounts = calculateFiscalAmounts(items.map(item => ({
    subtotal: item.subtotal,
    ivaType: item.ivaType as any,
    ivaAmount: item.ivaAmount
  })))
  
  const subtotal = fiscalAmounts.taxedAmount + fiscalAmounts.nonTaxedAmount + fiscalAmounts.exemptAmount
  const taxAmount = fiscalAmounts.taxAmount
  const total = fiscalAmounts.total
  const discountAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discount / 100), 0)

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData(prev => ({
      ...prev,
      customerId: customer.id
    }))
  }

  const addItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      discount: selectedCustomer?.discount || 0,
      subtotal: 0,
      description: '',
      ivaType: 'iva_21',
      ivaAmount: 0,
      totalAmount: 0
    }
    setItems(prev => [...prev, newItem])
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // Validar stock si se está cambiando la cantidad
        if (field === 'quantity' && value > 0) {
          const product = products.find(p => p.id === item.productId)
          if (product && value > product.stock) {
            toast.error(`Stock insuficiente. Disponible: ${product.stock}`)
            return item // No actualizar si excede el stock
          }
        }
        
        // Recalcular subtotal si cambió cantidad, precio o descuento
        if (['quantity', 'unitPrice', 'discount'].includes(field)) {
          const quantity = field === 'quantity' ? value : updatedItem.quantity
          const unitPrice = field === 'unitPrice' ? value : updatedItem.unitPrice
          const discount = field === 'discount' ? value : updatedItem.discount
          
          const subtotalSinDescuento = quantity * unitPrice
          const montoDescuento = subtotalSinDescuento * (discount / 100)
          const subtotal = subtotalSinDescuento - montoDescuento
          
          // Calcular IVA
          const ivaAmount = calculateIVA(subtotal, updatedItem.ivaType as any)
          const totalAmount = subtotal + ivaAmount
          
          updatedItem.subtotal = subtotal
          updatedItem.ivaAmount = ivaAmount
          updatedItem.totalAmount = totalAmount
        }
        
        return updatedItem
      }
      return item
    }))
  }

  const handleProductSelect = (itemId: string, product: Product) => {
    updateItem(itemId, 'productId', product.id)
    updateItem(itemId, 'productName', product.name)
    updateItem(itemId, 'unitPrice', product.finalPriceArs)
    updateItem(itemId, 'description', product.internalCode || '')
    updateItem(itemId, 'ivaType', product.ivaType)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerId) {
      toast.error('Selecciona un cliente')
      return
    }
    
    if (items.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }
    
    if (items.some(item => !item.productId || item.quantity <= 0)) {
      toast.error('Completa todos los productos')
      return
    }
    
    // Validar stock para todos los productos
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) {
        toast.error(`Producto no encontrado: ${item.productName}`)
        return
      }
      if (product.stock < item.quantity) {
        toast.error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`)
        return
      }
    }
    
    setLoading(true)

    try {
      // 1. Crear la venta
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Limpiar quoteId si está vacío
          quoteId: formData.quoteId && formData.quoteId !== '' ? formData.quoteId : undefined,
          // Información fiscal
          invoiceType: selectedCustomer ? getInvoiceTypeForCustomer(selectedCustomer.customerType as any) : 'FACTURA_B',
          taxedAmount: fiscalAmounts.taxedAmount,
          nonTaxedAmount: fiscalAmounts.nonTaxedAmount,
          exemptAmount: fiscalAmounts.exemptAmount,
          // Totales
          subtotal: subtotal,
          taxAmount: taxAmount,
          discountAmount: discountAmount,
          total: total,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            subtotal: item.subtotal,
            description: item.description,
            ivaType: item.ivaType,
            ivaAmount: item.ivaAmount,
            totalAmount: item.totalAmount
          }))
        }),
      })

      if (response.ok) {
        const sale = await response.json()
        
        setCreatedSale(sale)
        toast.success('Venta creada y registrada automáticamente en cuenta corriente')
        
        // Mostrar modal de pago
        setShowPaymentModal(true)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear la venta')
      }
    } catch (error) {
      toast.error('Error interno del servidor')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentData: any) => {
    if (!createdSale) return
    
    try {
      // Crear movimiento de HABER para reducir la deuda del cliente
      const response = await fetch('/api/current-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: createdSale.customerId,
          type: 'haber',
          concept: `Pago ${paymentData.paymentNumber} - ${paymentData.method}`,
          amount: paymentData.amount,
          reference: paymentData.paymentNumber,
          paymentId: paymentData.id,
          date: new Date(),
          notes: `Pago de venta ${createdSale.saleNumber}`
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        const newBalance = result.newBalance
        
        if (newBalance <= 0) {
          toast.success('Pago aplicado - Deuda cancelada completamente')
        } else {
          toast.success(`Pago aplicado - Saldo pendiente: $${newBalance.toFixed(2)}`)
        }
      } else {
        toast.error('Pago creado pero error al aplicar a cuenta corriente')
      }
    } catch (error) {
      console.error('Error al registrar pago en cuenta corriente:', error)
      toast.error('Error al registrar el pago')
    }
    
    setShowPaymentModal(false)
    router.push(`/comercializacion/ventas?tab=ventas`)
  }

  const handleSkipPayment = () => {
    // Ya no es necesario crear nada, la venta ya está en cuenta corriente
    toast.success('Venta registrada en cuenta corriente - Cliente debe pagar')
    setShowPaymentModal(false)
    router.push(`/comercializacion/ventas?tab=ventas`)
  }

  const loadAvailableQuotes = async () => {
    try {
      const response = await fetch('/api/quotes?status=aceptado&limit=50')
      if (response.ok) {
        const data = await response.json()
        setAvailableQuotes(data.quotes || [])
        setShowQuoteSelector(true)
      } else {
        toast.error('Error al cargar presupuestos')
      }
    } catch (error) {
      toast.error('Error al cargar presupuestos')
    }
  }

  const handleQuoteSelect = async (quote: any) => {
    try {
      // Cargar los datos del presupuesto completo
      const response = await fetch(`/api/quotes/${quote.id}`)
      if (response.ok) {
        const quoteData = await response.json()
        
        // Llenar el formulario con los datos del presupuesto
        setFormData(prev => ({
          ...prev,
          customerId: quoteData.customerId,
          notes: quoteData.notes || '',
        }))
        
        // Cargar el cliente
        setSelectedCustomer(quoteData.customer)
        
        // Convertir items del presupuesto a items de venta
        const saleItems = quoteData.items.map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          productId: item.productId,
          productName: item.product?.name || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal,
          description: item.description || '',
          ivaType: item.ivaType,
          ivaAmount: item.ivaAmount,
          totalAmount: item.totalAmount
        }))
        
        setItems(saleItems)
        setShowQuoteSelector(false)
        toast.success(`Presupuesto ${quoteData.quoteNumber} cargado exitosamente`)
        
        // Actualizar el formData para incluir el quoteId
        setFormData(prev => ({ ...prev, quoteId: quote.id }))
      } else {
        toast.error('Error al cargar el presupuesto')
      }
    } catch (error) {
      toast.error('Error al procesar el presupuesto')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/comercializacion/ventas?tab=ventas">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Ventas
          </Button>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Nueva Venta</h1>
            <p className="text-gray-600">Crea una nueva venta manual</p>
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={loadAvailableQuotes}
            >
              📋 Cargar Presupuesto
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Venta</CardTitle>
                <CardDescription>Datos generales de la venta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer">Cliente *</Label>
                    <CustomerSelector
                      value={formData.customerId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                      onCustomerSelect={handleCustomerSelect}
                      placeholder="Seleccionar cliente..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="isWhiteInvoice">Tipo de Facturación</Label>
                    <Select
                      value={formData.isWhiteInvoice ? 'blanco' : 'negro'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, isWhiteInvoice: value === 'blanco' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blanco">En Blanco (AFIP)</SelectItem>
                        <SelectItem value="negro">En Negro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="saleDate">Fecha de Venta</Label>
                    <Input
                      id="saleDate"
                      type="date"
                      value={formData.saleDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryDate">Fecha de Entrega</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Productos */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Productos</CardTitle>
                    <CardDescription>Agrega productos a la venta</CardDescription>
                  </div>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No hay productos agregados</p>
                    <Button type="button" onClick={addItem} variant="outline" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar primer producto
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Producto #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="md:col-span-2">
                            <Label>Producto</Label>
                            <ProductSelector
                              value={item.productId}
                              onValueChange={(value) => updateItem(item.id, 'productId', value)}
                              onProductSelect={(product) => handleProductSelect(item.id, product)}
                              placeholder="Seleccionar producto..."
                            />
                          </div>
                          <div>
                            <Label>Cantidad</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>Precio Unit.</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>Desc. %</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <div>
                            <Label>Descripción</Label>
                            <Input
                              placeholder="Descripción adicional..."
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            />
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Subtotal</p>
                            <p className="text-lg font-bold">${item.subtotal.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notas */}
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notas para el Cliente</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas visibles para el cliente..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="internalNotes">Notas Internas</Label>
                  <Textarea
                    id="internalNotes"
                    value={formData.internalNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                    placeholder="Notas internas no visibles al cliente..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumen de Venta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Descuento:</span>
                    <span className="text-green-600">-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (21%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Cliente Seleccionado</h4>
                    <p className="text-sm">{selectedCustomer.businessName}</p>
                    {selectedCustomer.contactName && (
                      <p className="text-sm text-gray-600">{selectedCustomer.contactName}</p>
                    )}
                    {selectedCustomer.taxId && (
                      <p className="text-sm text-gray-600">CUIT: {selectedCustomer.taxId}</p>
                    )}
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <Button type="submit" className="w-full" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar Venta'}
                  </Button>
                  <Link href="/comercializacion/ventas?tab=ventas">
                    <Button type="button" variant="outline" className="w-full">
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {showPaymentModal && createdSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Procesar Pago - Venta #{createdSale.saleNumber}</h2>
              <p className="text-gray-600 mt-1">
                Total: <span className="font-bold text-green-600">${createdSale.total.toFixed(2)}</span>
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">¿Cómo deseas procesar esta venta?</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setShowPaymentForm(true)}>
                    <CardContent className="p-4 text-center">
                      <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        💳
                      </div>
                      <h4 className="font-medium">Recibir Pago</h4>
                      <p className="text-sm text-gray-600">El cliente paga ahora (efectivo, tarjeta, cheque, etc.)</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:bg-gray-50" onClick={handleSkipPayment}>
                    <CardContent className="p-4 text-center">
                      <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        📋
                      </div>
                      <h4 className="font-medium">Cuenta Corriente</h4>
                      <p className="text-sm text-gray-600">El cliente pagará después, agregar a su cuenta corriente</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {showPaymentForm && (
                <div className="border-t pt-6">
                  <PaymentForm
                    customerId={createdSale.customerId}
                    saleId={createdSale.id}
                    amount={createdSale.total}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setShowPaymentForm(false)}
                  />
                </div>
              )}
              
              {!showPaymentForm && (
                <div className="flex gap-3 justify-end border-t pt-4">
                  <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para seleccionar presupuestos */}
      {showQuoteSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Seleccionar Presupuesto</h2>
              <p className="text-gray-600 mt-1">Elige un presupuesto para convertir en venta</p>
            </div>
            
            <div className="p-6">
              {availableQuotes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay presupuestos aceptados disponibles</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableQuotes.map((quote) => (
                    <div 
                      key={quote.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleQuoteSelect(quote)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{quote.quoteNumber}</h3>
                          <p className="text-sm text-gray-600">{quote.customer?.businessName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(quote.quoteDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${quote.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{quote.items?.length || 0} productos</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setShowQuoteSelector(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 