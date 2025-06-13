"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Package2, Calendar, DollarSign } from "lucide-react"
import { formatUSD } from "@/lib/costs"
import type { ProductBatch } from "@/lib/types"

interface ProductBatchViewProps {
  batches: ProductBatch[]
  productName: string
  totalStock: number
  averageCost: number
}

export default function ProductBatchView({ 
  batches, 
  productName, 
  totalStock, 
  averageCost 
}: ProductBatchViewProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (batches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Package2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay lotes registrados para este producto</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalValue = batches.reduce((sum, batch) => sum + batch.totalCostUsd, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Historial de Lotes - {productName}
          </CardTitle>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {batches.length} lotes
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Stock Total</p>
            <p className="text-2xl font-bold text-blue-600">{totalStock}</p>
            <p className="text-xs text-gray-500">unidades</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Costo Promedio</p>
            <p className="text-2xl font-bold text-green-600">{formatUSD(averageCost)}</p>
            <p className="text-xs text-gray-500">por unidad</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="text-2xl font-bold text-purple-600">{formatUSD(totalValue)}</p>
            <p className="text-xs text-gray-500">en inventario</p>
          </div>
        </div>

        {/* Detalle de Lotes */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                    <TableHead className="text-center">Fecha</TableHead>
                    <TableHead>Orden</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {batch.batchNumber}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {batch.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatUSD(batch.unitCostUsd)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatUSD(batch.totalCostUsd)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3 opacity-70" />
                          <span className="text-sm">
                            {new Date(batch.receivedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {batch.orderId.slice(-8)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {batch.location || "Sin ubicación"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {batch.notes || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Información adicional */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                Información de Costos
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• El <strong>costo promedio</strong> se calcula automáticamente basado en todos los lotes</p>
                <p>• Cada lote mantiene su <strong>costo original</strong> para trazabilidad</p>
                <p>• El stock total es la <strong>suma de todos los lotes</strong> activos</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
} 