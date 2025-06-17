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
import { ArrowLeft, Save, FileText, Plus, Trash2, Calculator } from "lucide-react"
import Link from 'next/link'
import { toast } from 'sonner'
import { CustomerSelector } from '@/components/comercializacion/customer-selector'
import { ProductSelector } from '@/components/comercializacion/product-selector'
import { calculateIVA, calculateFiscalAmounts, IVA_NAMES } from '@/lib/fiscal-utils'

interface QuoteItem {
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

export default function NuevoPresupuestoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    customerId: '',
    status: 'pendiente' as const,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días por defecto
    notes: '',
    internalNotes: '',
    title: ''
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
    const newItem: QuoteItem = {
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
    
    if (!formData.title.trim()) {
      toast.error('Ingresa un título para el presupuesto')
      return
    }
    
    setLoading(true)
    
    try {
      const quoteData = {
        ...formData,
        subtotal,
        taxAmount,
        total,
        discountAmount,
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
      }
      
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el presupuesto')
      }
      
      const createdQuote = await response.json()
      
      toast.success('Presupuesto creado exitosamente')
      router.push(`/comercializacion/ventas/presupuestos/${createdQuote.id}`)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear el presupuesto')
    } finally {
      setLoading(false)
    }
  }

  // Inicializar con un item vacío
  useEffect(() => {
    if (items.length === 0) {
      addItem()
    }
  }, [])

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/comercializacion/ventas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Presupuesto</h1>
          <p className="text-gray-600">Crea un nuevo presupuesto para un cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información del Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título del Presupuesto *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Presupuesto equipos de oficina"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="validUntil">Válido hasta *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Cliente *</Label>
              <CustomerSelector
                value={formData.customerId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                onCustomerSelect={handleCustomerSelect}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="notes">Notas para el cliente</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Condiciones, términos, etc."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="internalNotes">Notas internas</Label>
                <Textarea
                  id="internalNotes"
                  value={formData.internalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                  placeholder="Notas para uso interno"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items del Presupuesto */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Productos y Servicios</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                         <div className="md:col-span-4">
                       <Label>Producto</Label>
                       <ProductSelector
                         value={item.productId}
                         onValueChange={(value) => updateItem(item.id, 'productId', value)}
                         onProductSelect={(product) => handleProductSelect(item.id, product)}
                       />
                     </div>

                    <div className="md:col-span-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Precio Unit.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <Label>Desc. %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Subtotal</Label>
                      <Input
                        value={`$${item.subtotal.toFixed(2)}`}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Descripción adicional</Label>
                      <Input
                        value={item.description || ''}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Descripción opcional"
                      />
                    </div>
                    
                    <div>
                      <Label>Tipo de IVA</Label>
                      <Select
                        value={item.ivaType}
                        onValueChange={(value) => updateItem(item.id, 'ivaType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(IVA_NAMES).map(([key, name]) => (
                            <SelectItem key={key} value={key}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Totales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Resumen del Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IVA:</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4">
          <Link href="/comercializacion/ventas">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Presupuesto
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 