'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Receipt, Calculator, FileText } from "lucide-react"

interface FiscalSummaryProps {
  invoiceType: string
  taxedAmount: number
  nonTaxedAmount: number
  exemptAmount: number
  taxAmount: number
  total: number
  pointOfSale?: string
  invoiceNumber?: number
  fullNumber?: string
  authCode?: string
}

export function FiscalSummary({
  invoiceType,
  taxedAmount,
  nonTaxedAmount,
  exemptAmount,
  taxAmount,
  total,
  pointOfSale,
  invoiceNumber,
  fullNumber,
  authCode
}: FiscalSummaryProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const getInvoiceTypeBadge = (type: string) => {
    const colors = {
      'FACTURA_A': 'bg-blue-100 text-blue-800',
      'FACTURA_B': 'bg-green-100 text-green-800',
      'FACTURA_C': 'bg-orange-100 text-orange-800',
      'FACTURA_E': 'bg-purple-100 text-purple-800'
    }
    
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Información Fiscal
          </CardTitle>
          {getInvoiceTypeBadge(invoiceType)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Número de comprobante */}
        {fullNumber && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <FileText className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Número de Comprobante</p>
              <p className="text-lg font-mono">{fullNumber}</p>
            </div>
          </div>
        )}

        {/* CAE */}
        {authCode && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Calculator className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">CAE - AFIP</p>
              <p className="text-sm font-mono text-green-700">{authCode}</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Discriminación fiscal */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Discriminación Fiscal</h4>
          
          {taxedAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Monto Gravado</span>
              <span className="font-medium">{formatCurrency(taxedAmount)}</span>
            </div>
          )}
          
          {nonTaxedAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Monto No Gravado</span>
              <span className="font-medium">{formatCurrency(nonTaxedAmount)}</span>
            </div>
          )}
          
          {exemptAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Monto Exento</span>
              <span className="font-medium">{formatCurrency(exemptAmount)}</span>
            </div>
          )}
          
          {taxAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm">IVA Total</span>
              <span className="font-medium text-blue-600">{formatCurrency(taxAmount)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span className="text-green-600">{formatCurrency(total)}</span>
        </div>

        {/* Información adicional para Factura A */}
        {invoiceType === 'FACTURA_A' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Factura A:</strong> Discrimina IVA. Válida para Responsables Inscriptos.
              Los importes incluyen todos los impuestos correspondientes.
            </p>
          </div>
        )}

        {/* Información adicional para Factura B */}
        {invoiceType === 'FACTURA_B' && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-800">
              <strong>Factura B:</strong> IVA incluido. Válida para Monotributistas y Consumidores Finales.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 