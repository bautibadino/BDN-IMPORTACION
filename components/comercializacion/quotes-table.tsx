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
import { Plus, Eye, Edit, FileText, ShoppingCart } from "lucide-react"
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface Quote {
  id: string
  quoteNumber: string
  status: string
  quoteDate: string
  validUntil: string
  total: number
  customer: {
    businessName: string
  }
  _count: {
    sales: number
  }
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

export function QuotesTable() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [converting, setConverting] = useState<string | null>(null)

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/quotes')
      if (response.ok) {
        const data = await response.json()
        setQuotes(data.quotes || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConvertToSale = async (quoteId: string) => {
    if (!confirm('¿Está seguro de que desea convertir este presupuesto a venta?')) {
      return
    }

    setConverting(quoteId)
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'convert-to-sale' }),
      })

      if (response.ok) {
        const sale = await response.json()
        toast.success(`Presupuesto convertido a venta ${sale.saleNumber}`)
        fetchQuotes() // Recargar la lista
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al convertir presupuesto')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al convertir presupuesto')
    } finally {
      setConverting(null)
    }
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const getStatusWithExpiry = (quote: Quote) => {
    if (quote.status === 'enviado' && isExpired(quote.validUntil)) {
      return 'vencido'
    }
    return quote.status
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Lista de Presupuestos</CardTitle>
            <CardDescription>Gestiona todos los presupuestos del sistema</CardDescription>
          </div>
          <Link href="/comercializacion/ventas/presupuestos/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p>Cargando presupuestos...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No hay presupuestos registrados</p>
            <Link href="/comercializacion/ventas/presupuestos/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Presupuesto
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Válido Hasta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => {
                const currentStatus = getStatusWithExpiry(quote)
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.customer.businessName}</TableCell>
                    <TableCell>{new Date(quote.quoteDate).toLocaleDateString('es-AR')}</TableCell>
                    <TableCell>
                      <span className={isExpired(quote.validUntil) ? 'text-red-600' : ''}>
                        {new Date(quote.validUntil).toLocaleDateString('es-AR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[currentStatus as keyof typeof STATUS_COLORS]}>
                        {STATUS_LABELS[currentStatus as keyof typeof STATUS_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(quote.total)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/comercializacion/ventas/presupuestos/${quote.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/comercializacion/ventas/presupuestos/${quote.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {currentStatus === 'enviado' && !isExpired(quote.validUntil) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConvertToSale(quote.id)}
                            disabled={converting === quote.id}
                            title="Convertir a venta"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
} 