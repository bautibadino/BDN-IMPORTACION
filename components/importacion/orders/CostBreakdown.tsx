"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { getOrderCostBreakdownAction } from "@/app/importacion/orders/actions"
import { formatUSD, getImportCostTypeName, type OrderCostCalculation } from "@/lib/costs"
import { Loader2, Calculator, Package, PackagePlus } from "lucide-react"
import type { Order } from "@/lib/types"
import { AddToStockWithCategoriesForm } from "@/app/importacion/orders/[id]/components/add-to-stock-with-categories-form"

interface CostBreakdownProps {
  orderId: string
  order: Order
  onOrderUpdated?: () => void
  orderItems?: any[]
  allProductLeads?: any[]
}

export default function CostBreakdown({ orderId, order, onOrderUpdated, orderItems, allProductLeads }: CostBreakdownProps) {
  const [costData, setCostData] = useState<OrderCostCalculation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddToStockDialogOpen, setIsAddToStockDialogOpen] = useState(false)

  const loadCostBreakdown = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getOrderCostBreakdownAction(orderId)
      if (result.success && result.data) {
        setCostData(result.data)
      } else {
        setError(result.message || "Error al cargar el desglose de costos")
      }
    } catch (err) {
      setError("Error inesperado al cargar los costos")
      console.error("Error loading cost breakdown:", err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    if (onOrderUpdated) {
      onOrderUpdated()
    }
    loadCostBreakdown()
  }

  useEffect(() => {
    loadCostBreakdown()
  }, [orderId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Calculando costos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button 
              variant="outline" 
              onClick={loadCostBreakdown}
              className="mt-2"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!costData || costData.items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay items para calcular costos</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Costos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resumen de Costos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total FOB</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatUSD(costData.totalFobUsd)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Costos de Importación</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatUSD(costData.totalImportCostsUsd)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Costo Final Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatUSD(costData.totalFinalCostUsd)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desglose por Item */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio FOB Unit.</TableHead>
                  <TableHead className="text-right">Total FOB</TableHead>
                  <TableHead className="text-right">Costo Imp. Unit.</TableHead>
                  <TableHead className="text-right">Total Imp.</TableHead>
                  <TableHead className="text-right">Costo Final Unit.</TableHead>
                  <TableHead className="text-right">Total Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costData.items.map((item) => (
                  <TableRow key={item.productLeadId}>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatUSD(item.unitPriceFobUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatUSD(item.totalFobUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatUSD(item.importCostPerUnit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatUSD(item.totalImportCost)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatUSD(item.finalUnitCostUsd)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatUSD(item.totalFinalCostUsd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detalle de Costos de Importación */}
      {costData.importCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Costos de Importación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costData.importCosts.map((cost, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">
                      {getImportCostTypeName(cost.type)}
                    </span>
                    {cost.description && (
                      <p className="text-sm text-gray-600">{cost.description}</p>
                    )}
                  </div>
                  <span className="font-semibold">
                    {formatUSD(cost.amountUsd)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón de Finalización */}
      {order.status === "recibido" && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {(order as any).isProcessedToStock ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-green-600">✅ Orden Procesada</h3>
                  <p className="text-sm text-gray-600">
                    Esta orden ya fue procesada a stock el{" "}
                    {(order as any).processedAt ? 
                      new Date((order as any).processedAt).toLocaleDateString() : 
                      "anteriormente"
                    }.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Los productos ya fueron creados/actualizados en stock con los costos finales.
                  </p>
                </div>
              ) : orderItems && allProductLeads && orderItems.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Agregar Items a Stock</h3>
                  <p className="text-sm text-gray-600">
                    Configura los productos y asigna categorías antes de crear el stock.
                  </p>
                  <Dialog open={isAddToStockDialogOpen} onOpenChange={setIsAddToStockDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                        <PackagePlus className="h-4 w-4 mr-2" />
                        Agregar Items a Stock
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl">
                      <AddToStockWithCategoriesForm
                        orderId={orderId}
                        orderItems={orderItems}
                        allProductLeads={allProductLeads}
                        order={order}
                        onClose={() => {
                          setIsAddToStockDialogOpen(false)
                          refreshData()
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-amber-600">Sin items para procesar</h3>
                  <p className="text-sm text-gray-600">
                    Añade items al pedido para poder ingresarlos al stock.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 