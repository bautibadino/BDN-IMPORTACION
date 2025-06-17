'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Edit, Trash2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IVA_NAMES } from '@/lib/fiscal-utils'
import { formatCurrency } from '@/lib/utils'

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

interface SaleItem {
  id: string
  quantity: number
  unitPrice: number
  subtotal: number
  ivaType: string
  ivaAmount: number
  totalAmount: number
  product: Product
}

interface Sale {
  id: string
  saleNumber: string
  saleDate: string
  status: string
  invoiceType: string
  subtotal: number
  taxAmount: number
  total: number
  notes?: string
  customer: Customer
  items: SaleItem[]
}

const STATUS_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-blue-100 text-blue-800',
  entregada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800'
}

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  entregada: 'Entregada',
  cancelada: 'Cancelada'
}

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Estados para edición
  const [editData, setEditData] = useState({
    customerId: '',
    items: [] as Array<{
      productId: string
      quantity: number
      unitPrice: number
    }>,
    notes: ''
  })
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (params.id) {
      fetchSale()
    }
  }, [params.id])

  useEffect(() => {
    if (isEditing) {
      fetchCustomers()
      fetchProducts()
    }
  }, [isEditing])

  const fetchSale = async () => {
    try {
      const response = await fetch(`/api/sales/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSale(data)
        
        // Preparar datos para edición
        setEditData({
          customerId: data.customer.id,
          items: data.items.map((item: SaleItem) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          notes: data.notes || ''
        })
      } else {
        toast.error('Error al cargar la venta')
        router.push('/comercializacion/ventas')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar la venta')
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
      const response = await fetch(`/api/sales/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        const updatedSale = await response.json()
        setSale(updatedSale)
        setIsEditing(false)
        toast.success('Venta actualizada correctamente')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar la venta')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar la venta')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar esta venta? Esta acción no se puede deshacer.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/sales/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Venta eliminada correctamente')
        router.push('/comercializacion/ventas')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar la venta')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar la venta')
    } finally {
      setDeleting(false)
    }
  }

  const addItem = () => {
    setEditData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitPrice: 0 }]
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

  if (!sale) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Venta no encontrada</h1>
          <Button onClick={() => router.push('/comercializacion/ventas')}>
            Volver a Ventas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/comercializacion/ventas')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Venta {sale.saleNumber}
            </h1>
            <p className="text-gray-500">
              {new Date(sale.saleDate).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={STATUS_COLORS[sale.status as keyof typeof STATUS_COLORS]}>
            {STATUS_LABELS[sale.status as keyof typeof STATUS_LABELS]}
          </Badge>
          
          {!isEditing && (
            <>
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
                  <p className="font-medium">{sale.customer.businessName}</p>
                  <p className="text-sm text-gray-500">{sale.customer.customerType}</p>
                </div>
                {sale.customer.email && (
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-600">{sale.customer.email}</p>
                  </div>
                )}
                {sale.customer.phone && (
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-gray-600">{sale.customer.phone}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Información Fiscal */}
        <Card>
          <CardHeader>
            <CardTitle>Información Fiscal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Tipo de Factura</p>
              <p className="text-sm text-gray-600">{sale.invoiceType}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Subtotal</p>
              <p className="text-sm text-gray-600">{formatCurrency(sale.subtotal)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">IVA</p>
              <p className="text-sm text-gray-600">{formatCurrency(sale.taxAmount)}</p>
            </div>
            <Separator />
            <div>
              <p className="font-medium">Total</p>
              <p className="text-lg font-bold">{formatCurrency(sale.total)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales..."
                rows={4}
              />
            ) : (
              <p className="text-sm text-gray-600">
                {sale.notes || 'Sin notas'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items de la Venta */}
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
                  <div className="col-span-4">
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
                  <div className="col-span-3">
                    <Label>Subtotal</Label>
                    <p className="text-sm font-medium py-2">
                      {formatCurrency(item.quantity * item.unitPrice)}
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
                      <th className="text-right py-2">IVA</th>
                      <th className="text-right py-2">Subtotal</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item) => (
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
                          </div>
                        </td>
                        <td className="text-right py-3">{item.quantity}</td>
                        <td className="text-right py-3">{formatCurrency(item.unitPrice)}</td>
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
    </div>
  )
} 