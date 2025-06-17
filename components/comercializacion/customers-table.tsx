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
import { Plus, Eye, Edit, User } from "lucide-react"
import Link from 'next/link'

interface Customer {
  id: string
  businessName: string
  contactName?: string
  taxId?: string
  customerType: string
  isActive: boolean
  currentBalance?: number
  _count: {
    sales: number
    quotes: number
  }
}

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'responsable_inscripto':
        return 'bg-blue-100 text-blue-800'
      case 'monotributo':
        return 'bg-green-100 text-green-800'
      case 'exento':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCustomerTypeLabel = (type: string) => {
    switch (type) {
      case 'responsable_inscripto':
        return 'Resp. Inscripto'
      case 'monotributo':
        return 'Monotributo'
      case 'consumidor_final':
        return 'Cons. Final'
      case 'exento':
        return 'Exento'
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>Gestiona todos los clientes del sistema</CardDescription>
          </div>
          <Link href="/comercializacion/ventas/clientes/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p>Cargando clientes...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No hay clientes registrados</p>
            <Link href="/comercializacion/ventas/clientes/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Cliente
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón Social</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>CUIT/CUIL</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ventas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.businessName}</TableCell>
                  <TableCell>{customer.contactName || '-'}</TableCell>
                  <TableCell>{customer.taxId || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getCustomerTypeColor(customer.customerType)}>
                      {getCustomerTypeLabel(customer.customerType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {customer._count.sales} venta{customer._count.sales !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                      {customer.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/comercializacion/ventas/clientes/${customer.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/comercializacion/ventas/clientes/${customer.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
} 