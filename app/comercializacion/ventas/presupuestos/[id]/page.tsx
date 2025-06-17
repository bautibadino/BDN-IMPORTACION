'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Edit, Trash2, Save, X, ShoppingCart, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IVA_NAMES } from '@/lib/fiscal-utils'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  ivaType: string
  unit: string
}

interface Customer {
  id: string
  businessName: string
  customerType: string
  email?: string
  phone?: string
}

interface QuoteItem {
  id: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
  ivaType: string
  ivaAmount: number
  totalAmount: number
  description?: string
  product: Product
}

interface Sale {
  id: string
  saleNumber: string
  saleDate: string
  status: string
  total: number
}

interface Quote {
  id: string
  quoteNumber: string
  quoteDate: string
  validUntil: string
  status: string
  subtotal: number
  taxAmount: number
  total: number
  notes?: string
  terms?: string
  customer: Customer
  items: QuoteItem[]
  sales: Sale[]
}

const STATUS_COLORS = {
  enviado: 'bg-blue-100 text-blue-800',
  aceptado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
  vencido: 'bg-red-100 text-red-800',
  borrador: 'bg-gray-100 text-gray-800'
}

const STATUS_LABELS = {
  enviado: 'Enviado',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  vencido: 'Vencido',
  borrador: 'Borrador'
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [converting, setConverting] = useState(false)
  
  // Estados para edición
  const [editData, setEditData] = useState({
    customerId: '',
    items: [] as Array<{
      productId: string
      quantity: number
      unitPrice: number
      discount: number
      description: string
    }>,
    notes: '',
    terms: '',
    validUntil: '',
    status: 'enviado'
  })
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (params.id) {
      fetchQuote()
    }
  }, [params.id])

  useEffect(() => {
    if (isEditing) {
      fetchCustomers()
      fetchProducts()
    }
  }, [isEditing])

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setQuote(data)
        
        // Preparar datos para edición
        setEditData({
          customerId: data.customer.id,
          items: data.items.map((item: QuoteItem) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            description: item.description || ''
          })),
          notes: data.notes || '',
          terms: data.terms || '',
          validUntil: data.validUntil ? new Date(data.validUntil).toISOString().split('T')[0] : '',
          status: data.status
        })
      } else {
        toast.error('Error al cargar el presupuesto')
        router.push('/comercializacion/ventas?tab=presupuestos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar el presupuesto')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?isActive=true')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    }
  }

  const handleSave = async () => {
    if (editData.items.length === 0) {
      toast.error('Debe agregar al menos un producto')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/quotes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        const updatedQuote = await response.json()
        setQuote(updatedQuote)
        setIsEditing(false)
        toast.success('Presupuesto actualizado correctamente')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar el presupuesto')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el presupuesto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar este presupuesto? Esta acción no se puede deshacer.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/quotes/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Presupuesto eliminado correctamente')
        router.push('/comercializacion/ventas?tab=presupuestos')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar el presupuesto')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el presupuesto')
    } finally {
      setDeleting(false)
    }
  }

  const handleConvertToSale = async () => {
    if (!confirm('¿Está seguro de que desea convertir este presupuesto a venta?')) {
      return
    }

    setConverting(true)
    try {
      const response = await fetch(`/api/quotes/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'convert-to-sale' }),
      })

      if (response.ok) {
        const sale = await response.json()
        toast.success(`Presupuesto convertido a venta ${sale.saleNumber}`)
        // Recargar el presupuesto para mostrar el nuevo estado
        await fetchQuote()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al convertir presupuesto')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al convertir presupuesto')
    } finally {
      setConverting(false)
    }
  }

  const addItem = () => {
    setEditData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitPrice: 0, discount: 0, description: '' }]
    }))
  }

  const removeItem = (index: number) => {
    setEditData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const isExpired = () => {
    return quote && new Date(quote.validUntil) < new Date()
  }

  const canConvert = () => {
    return quote && quote.status === 'enviado' && !isExpired()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Presupuesto no encontrado</h1>
          <Button onClick={() => router.push('/comercializacion/ventas?tab=presupuestos')}>
            Volver a Presupuestos
          </Button>
        </div>
      </div>
    )
  }

  const currentStatus = quote.status === 'enviado' && isExpired() ? 'vencido' : quote.status

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/comercializacion/ventas?tab=presupuestos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Presupuesto {quote.quoteNumber}
            </h1>
            <p className="text-gray-500">
              {new Date(quote.quoteDate).toLocaleDateString('es-AR')} - 
              Válido hasta {new Date(quote.validUntil).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={STATUS_COLORS[currentStatus as keyof typeof STATUS_COLORS]}>
            {STATUS_LABELS[currentStatus as keyof typeof STATUS_LABELS]}
          </Badge>
          
          {!isEditing && (
            <>
              {canConvert() && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConvertToSale}
                  disabled={converting}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {converting ? 'Convirtiendo...' : 'Convertir a Venta'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </>
          )}
          
          {isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditing ? (
              <div>
                <Label htmlFor="customer">Cliente</Label>
                <Select
                  value={editData.customerId}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium">{quote.customer.businessName}</p>
                  <p className="text-sm text-gray-500">{quote.customer.customerType}</p>
                </div>
                {quote.customer.email && (
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-600">{quote.customer.email}</p>
                  </div>
                )}
                {quote.customer.phone && (
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-gray-600">{quote.customer.phone}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Información del Presupuesto */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Presupuesto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="validUntil">Válido Hasta</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={editData.validUntil}
                    onChange={(e) => setEditData(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={editData.status}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="aceptado">Aceptado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium">Subtotal</p>
                  <p className="text-sm text-gray-600">{formatCurrency(quote.subtotal)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">IVA</p>
                  <p className="text-sm text-gray-600">{formatCurrency(quote.taxAmount)}</p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">Total</p>
                  <p className="text-lg font-bold">{formatCurrency(quote.total)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ventas Generadas */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Generadas</CardTitle>
          </CardHeader>
          <CardContent>
            {quote.sales.length === 0 ? (
              <p className="text-sm text-gray-600">
                No se han generado ventas desde este presupuesto
              </p>
            ) : (
              <div className="space-y-2">
                {quote.sales.map((sale) => (
                  <Link key={sale.id} href={`/comercializacion/ventas/${sale.id}`}>
                    <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer">
                      <p className="font-medium text-sm">{sale.saleNumber}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(sale.saleDate).toLocaleDateString('es-AR')} - {formatCurrency(sale.total)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Términos y Notas */}
      {isEditing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Términos y Condiciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editData.terms}
                onChange={(e) => setEditData(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Términos y condiciones del presupuesto..."
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Items del Presupuesto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Productos</CardTitle>
          {isEditing && (
            <Button size="sm" onClick={addItem}>
              Agregar Producto
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isEditing ? (
              // Modo edición
              editData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                  <div className="col-span-3">
                    <Label>Producto</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => {
                        const product = products.find(p => p.id === value)
                        updateItem(index, 'productId', value)
                        if (product) {
                          updateItem(index, 'unitPrice', product.price)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Precio Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Desc. %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Label>Subtotal</Label>
                    <p className="text-sm font-medium py-2">
                      {formatCurrency(item.quantity * item.unitPrice * (1 - item.discount / 100))}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              // Modo visualización
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Producto</th>
                      <th className="text-right py-2">Cantidad</th>
                      <th className="text-right py-2">Precio Unit.</th>
                      <th className="text-right py-2">Desc.</th>
                      <th className="text-right py-2">IVA</th>
                      <th className="text-right py-2">Subtotal</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {IVA_NAMES[item.ivaType as keyof typeof IVA_NAMES]}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {item.product.unit}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3">{item.quantity}</td>
                        <td className="text-right py-3">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right py-3">{item.discount}%</td>
                        <td className="text-right py-3">{formatCurrency(item.ivaAmount)}</td>
                        <td className="text-right py-3">{formatCurrency(item.subtotal)}</td>
                        <td className="text-right py-3 font-medium">
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Términos y Notas en modo visualización */}
      {!isEditing && (quote.terms || quote.notes) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quote.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Términos y Condiciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.terms}</p>
              </CardContent>
            </Card>
          )}

          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
} 