'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Eye, CreditCard, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface CurrentAccountItem {
  id: string
  date: string
  type: string
  concept: string
  reference?: string
  amount: number
  balance: number
  customer: {
    id: string
    businessName: string
    contactName?: string
  }
  invoice?: {
    id: string
    invoiceNumber: string
    invoiceDate: string
  }
  payment?: {
    id: string
    paymentNumber: string
    paymentDate: string
  }
}

interface CurrentAccountData {
  items: CurrentAccountItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function CurrentAccountTable() {
  const [data, setData] = useState<CurrentAccountData>({ 
    items: [], 
    pagination: { page: 1, limit: 10, total: 0, pages: 0 } 
  })
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    customerId: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: ''
  })
  const [customers, setCustomers] = useState<Array<{ id: string, businessName: string }>>([])

  useEffect(() => {
    fetchCurrentAccount()
    fetchCustomers()
  }, [])

  useEffect(() => {
    fetchCurrentAccount()
  }, [filters])

  const fetchCurrentAccount = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.customerId && filters.customerId !== 'all') params.append('customerId', filters.customerId)
      if (filters.type && filters.type !== 'all') params.append('type', filters.type)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      console.log('Fetching current account with params:', params.toString())
      
      const response = await fetch(`/api/current-account?${params.toString()}`)
      
      console.log('Current account response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Current account data received:', result)
        setData(result)
      } else {
        const error = await response.text()
        console.error('API Error:', error)
      }
    } catch (error) {
      console.error('Error fetching current account:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers...')
      const response = await fetch('/api/customers')
      console.log('Customers response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Customers data received:', result.length, 'customers')
        setCustomers(result)
      } else {
        const error = await response.text()
        console.error('Error fetching customers:', error)
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    }
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-red-600' // Debe
    if (balance < 0) return 'text-green-600' // Haber
    return 'text-gray-600' // Sin saldo
  }

  const getAmountColor = (type: string) => {
    return type === 'debe' ? 'text-red-600' : 'text-green-600'
  }

  const getTypeLabel = (type: string) => {
    return type === 'debe' ? 'Debe' : 'Haber'
  }

  const clearFilters = () => {
    setFilters({
      customerId: 'all',
      type: 'all',
      dateFrom: '',
      dateTo: ''
    })
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Cliente</label>
              <Select
                value={filters.customerId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="debe">Debe</SelectItem>
                  <SelectItem value="haber">Haber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Fecha Desde</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Fecha Hasta</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de movimientos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Movimientos de Cuenta Corriente</CardTitle>
              <CardDescription>
                Historial de movimientos de todos los clientes
                {data.pagination.total > 0 && (
                  <span className="ml-2">
                    ({data.pagination.total} movimiento{data.pagination.total !== 1 ? 's' : ''})
                  </span>
                )}
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Movimiento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Cargando movimientos...</p>
            </div>
          ) : data.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No hay movimientos de cuenta corriente</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Movimiento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.date).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.customer.businessName}</p>
                          {item.customer.contactName && (
                            <p className="text-sm text-gray-500">{item.customer.contactName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.concept}</p>
                          {item.invoice && (
                            <p className="text-sm text-gray-500">
                              Factura: {item.invoice.invoiceNumber}
                            </p>
                          )}
                          {item.payment && (
                            <p className="text-sm text-gray-500">
                              Pago: {item.payment.paymentNumber}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.reference || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.type === 'debe' ? 'destructive' : 'default'}>
                          {getTypeLabel(item.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getAmountColor(item.type)}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getBalanceColor(item.balance)}`}>
                          {formatCurrency(item.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/comercializacion/ventas/clientes/${item.customer.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {data.pagination.pages > 1 && (
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Página {data.pagination.page} de {data.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page === data.pagination.pages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 