'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Edit, Trash2, Save, X, User, ShoppingCart, FileText, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatCurrency } from '@/lib/utils'
import { validateCUIT, formatCUIT } from '@/lib/fiscal-utils'
import Link from 'next/link'

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
  status: string
  total: number
}

interface CurrentAccountItem {
  id: string
  date: string
  type: string
  amount: number
  description: string
}

interface Customer {
  id: string
  businessName: string
  taxId?: string
  customerType: string
  contactName?: string
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  city?: string
  province?: string
  postalCode?: string
  notes?: string
  isActive: boolean
  creditLimit?: number
  paymentTerms?: number
  priceList?: string
  discount?: number
  createdAt: string
  updatedAt: string
  sales: Sale[]
  quotes: Quote[]
  currentAccountItems: CurrentAccountItem[]
  _count: {
    sales: number
    quotes: number
    currentAccountItems: number
  }
}

const CUSTOMER_TYPES = [
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
  { value: 'monotributo', label: 'Monotributo' },
  { value: 'consumidor_final', label: 'Consumidor Final' },
  { value: 'exento', label: 'Exento' }
]

const STATUS_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-blue-100 text-blue-800',
  entregada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  pagada: 'bg-green-100 text-green-800',
  facturada: 'bg-blue-100 text-blue-800',
  enviado: 'bg-blue-100 text-blue-800',
  aceptado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
  vencido: 'bg-red-100 text-red-800'
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Estados para edición
  const [editData, setEditData] = useState({
    businessName: '',
    taxId: '',
    customerType: 'consumidor_final',
    contactName: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
    isActive: true,
    creditLimit: '',
    paymentTerms: '',
    priceList: '',
    discount: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchCustomer()
    }
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
        
        // Preparar datos para edición
        setEditData({
          businessName: data.businessName || '',
          taxId: data.taxId || '',
          customerType: data.customerType || 'consumidor_final',
          contactName: data.contactName || '',
          email: data.email || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          address: data.address || '',
          city: data.city || '',
          province: data.province || '',
          postalCode: data.postalCode || '',
          notes: data.notes || '',
          isActive: data.isActive,
          creditLimit: data.creditLimit?.toString() || '',
          paymentTerms: data.paymentTerms?.toString() || '',
          priceList: data.priceList || '',
          discount: data.discount?.toString() || ''
        })
      } else {
        toast.error('Error al cargar el cliente')
        router.push('/comercializacion/ventas?tab=clientes')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar el cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editData.businessName.trim()) {
      toast.error('La razón social es obligatoria')
      return
    }

    if (editData.taxId && !validateCUIT(editData.taxId)) {
      toast.error('El CUIT/CUIL ingresado no es válido')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/customers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        const updatedCustomer = await response.json()
        // Recargar datos completos
        await fetchCustomer()
        setIsEditing(false)
        toast.success('Cliente actualizado correctamente')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar el cliente')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el cliente')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/customers/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Cliente eliminado correctamente')
        router.push('/comercializacion/ventas?tab=clientes')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar el cliente')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar el cliente')
    } finally {
      setDeleting(false)
    }
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

  if (!customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cliente no encontrado</h1>
          <Button onClick={() => router.push('/comercializacion/ventas?tab=clientes')}>
            Volver a Clientes
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
            onClick={() => router.push('/comercializacion/ventas?tab=clientes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.businessName}
            </h1>
            <p className="text-gray-500">
              Cliente desde {new Date(customer.createdAt).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={customer.isActive ? 'default' : 'secondary'}>
            {customer.isActive ? 'Activo' : 'Inactivo'}
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

      {/* Información Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datos Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="businessName">Razón Social *</Label>
                  <Input
                    id="businessName"
                    value={editData.businessName}
                    onChange={(e) => setEditData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Razón social del cliente"
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">CUIT/CUIL</Label>
                  <Input
                    id="taxId"
                    value={editData.taxId}
                    onChange={(e) => setEditData(prev => ({ ...prev, taxId: e.target.value }))}
                    placeholder="XX-XXXXXXXX-X"
                  />
                </div>
                <div>
                  <Label htmlFor="customerType">Tipo de Cliente</Label>
                  <Select
                    value={editData.customerType}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, customerType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contactName">Nombre de Contacto</Label>
                  <Input
                    id="contactName"
                    value={editData.contactName}
                    onChange={(e) => setEditData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Nombre del contacto principal"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium">CUIT/CUIL</p>
                  <p className="text-sm text-gray-600">
                    {customer.taxId ? formatCUIT(customer.taxId) : 'No especificado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tipo de Cliente</p>
                  <Badge className="mt-1">
                    {CUSTOMER_TYPES.find(t => t.value === customer.customerType)?.label || customer.customerType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Contacto Principal</p>
                  <p className="text-sm text-gray-600">
                    {customer.contactName || 'No especificado'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0351-123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={editData.whatsapp}
                    onChange={(e) => setEditData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="351-123-4567"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">
                    {customer.email || 'No especificado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Teléfono</p>
                  <p className="text-sm text-gray-600">
                    {customer.phone || 'No especificado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">WhatsApp</p>
                  <p className="text-sm text-gray-600">
                    {customer.whatsapp || 'No especificado'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Configuración Comercial */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Comercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="creditLimit">Límite de Crédito</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={editData.creditLimit}
                    onChange={(e) => setEditData(prev => ({ ...prev, creditLimit: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Días de Pago</Label>
                  <Input
                    id="paymentTerms"
                    type="number"
                    value={editData.paymentTerms}
                    onChange={(e) => setEditData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Descuento (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={editData.discount}
                    onChange={(e) => setEditData(prev => ({ ...prev, discount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={editData.isActive}
                    onCheckedChange={(checked) => setEditData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Cliente Activo</Label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium">Límite de Crédito</p>
                  <p className="text-sm text-gray-600">
                    {customer.creditLimit ? formatCurrency(customer.creditLimit) : 'Sin límite'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Días de Pago</p>
                  <p className="text-sm text-gray-600">
                    {customer.paymentTerms ? `${customer.paymentTerms} días` : 'No especificado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Descuento</p>
                  <p className="text-sm text-gray-600">
                    {customer.discount ? `${customer.discount}%` : 'Sin descuento'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dirección y Notas */}
      {isEditing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dirección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={editData.address}
                  onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Calle y número"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={editData.city}
                    onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ciudad"
                  />
                </div>
                <div>
                  <Label htmlFor="province">Provincia</Label>
                  <Input
                    id="province"
                    value={editData.province}
                    onChange={(e) => setEditData(prev => ({ ...prev, province: e.target.value }))}
                    placeholder="Provincia"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  value={editData.postalCode}
                  onChange={(e) => setEditData(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="5000"
                />
              </div>
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
                placeholder="Notas adicionales sobre el cliente..."
                rows={6}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs con información adicional */}
      {!isEditing && (
        <Tabs defaultValue="ventas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ventas" className="flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Ventas ({customer._count.sales})
            </TabsTrigger>
            <TabsTrigger value="presupuestos" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Presupuestos ({customer._count.quotes})
            </TabsTrigger>
            <TabsTrigger value="cuenta-corriente" className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Cuenta Corriente ({customer._count.currentAccountItems})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ventas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.sales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No hay ventas registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customer.sales.map((sale) => (
                      <Link key={sale.id} href={`/comercializacion/ventas/${sale.id}`}>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div>
                            <p className="font-medium">{sale.saleNumber}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(sale.saleDate).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(sale.total)}</p>
                            <Badge className={STATUS_COLORS[sale.status as keyof typeof STATUS_COLORS]}>
                              {sale.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presupuestos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Presupuestos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.quotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No hay presupuestos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customer.quotes.map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{quote.quoteNumber}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(quote.quoteDate).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(quote.total)}</p>
                          <Badge className={STATUS_COLORS[quote.status as keyof typeof STATUS_COLORS]}>
                            {quote.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cuenta-corriente" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Movimientos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.currentAccountItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No hay movimientos en cuenta corriente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customer.currentAccountItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(item.date).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(item.amount))}
                          </p>
                          <p className="text-sm text-gray-500">{item.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
} 