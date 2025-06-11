"use client" // Convertir a Client Component para manejar estado del Dialog y status

import type React from "react" // Necesario para JSX si no es implícito
import { useState, useEffect } from "react" // Para manejar estado del Dialog y datos
import { PageHeader } from "@/app/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CalendarDays, Truck, Anchor, DollarSign, PlusCircle, PackagePlus } from "lucide-react"
import { OrderItemsSection } from "../components/order-items-section"
import { OrderStatusUpdater } from "./components/order-status-updater" // Importado
import { AddToStockForm } from "./components/add-to-stock-form" // Importado
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog" // DialogTrigger
import type { Order, OrderItem, ProductLead } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getOrderByIdAction, getOrderItemsByOrderIdAction, getProductLeadsAction } from "../actions"

// const USD_TO_ARS_RATE = 1250.0 // Ya no es necesario aquí, se usa en AddToStockForm

// Esta página ahora necesita ser un Client Component para manejar el estado del pedido dinámicamente
// y el estado de los diálogos.
export default function OrderDetailPageClient({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [initialOrderItems, setInitialOrderItems] = useState<OrderItem[]>([])
  const [allProductLeads, setAllProductLeads] = useState<ProductLead[]>([])
  const [isAddToStockDialogOpen, setIsAddToStockDialogOpen] = useState(false)
  const [dataVersion, setDataVersion] = useState(0) // Para forzar recarga

  useEffect(() => {
    async function fetchData() {
      const orderData = await getOrderByIdAction(params.id)
      setOrder(orderData || null)
      if (orderData) {
        const itemsData = await getOrderItemsByOrderIdAction(params.id)
        setInitialOrderItems(itemsData)
      }
      const leadsData = await getProductLeadsAction()
      setAllProductLeads(leadsData)
    }
    fetchData()
  }, [params.id, dataVersion]) // Recargar si cambia el ID o dataVersion

  const refreshOrderData = () => {
    setDataVersion((v) => v + 1)
  }

  if (!order) {
    return (
      <PageHeader title="Cargando pedido...">
        <Button asChild variant="outline">
          <Link href="/orders">Volver a Pedidos</Link>
        </Button>
      </PageHeader>
    )
  }

  const getStatusVariant = (status: Order["status"]): "default" | "secondary" | "destructive" | "outline" => {
    // ... (misma función que antes)
    switch (status) {
      case "pagado":
      case "embarcado":
      case "recibido":
        return "default"
      case "pendiente_pago":
      case "en_produccion":
      case "listo_embarque":
      case "en_transito":
      case "en_aduana":
        return "secondary"
      case "cancelado":
        return "destructive"
      case "borrador":
      default:
        return "outline"
    }
  }

  return (
    <>
      <PageHeader
        title={`Pedido: ${order.orderNumber}`}
        description={`Gestiona los detalles, items, costos y documentos de este pedido.`}
      >
        {/* <Button variant="outline" size="sm" disabled> <Edit className="mr-2 h-4 w-4" /> Editar Pedido </Button> */}
        <Button asChild variant="outline" size="sm">
          <Link href="/orders">Volver</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Información del Pedido</CardTitle>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant={getStatusVariant(order.status)} className="text-sm capitalize">
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                icon={CalendarDays}
                label="Fecha Pedido"
                value={new Date(order.orderDate).toLocaleDateString()}
              />
              <InfoItem icon={Truck} label="Tipo Envío" value={order.shipmentType} className="capitalize" />
              <InfoItem icon={Anchor} label="Incoterm" value={order.incoterm} />
              {order.forwarder && <InfoItem label="Forwarder" value={order.forwarder} />}
              {order.trackingCode && <InfoItem label="Tracking" value={order.trackingCode} />}
              {order.estimatedArrival && (
                <InfoItem
                  icon={CalendarDays}
                  label="Llegada Estimada"
                  value={new Date(order.estimatedArrival).toLocaleDateString()}
                />
              )}
              {order.portOfOrigin && <InfoItem label="Puerto Origen" value={order.portOfOrigin} />}
              {order.portOfDestination && <InfoItem label="Puerto Destino" value={order.portOfDestination} />}
            </CardContent>
          </Card>

          <OrderItemsSection
            orderId={order.id}
            initialOrderItems={initialOrderItems}
            allProductLeads={allProductLeads}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Costos de Importación</CardTitle>
              <Button variant="outline" size="sm" disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Costo
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Próximamente...</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.status === "recibido" && initialOrderItems.length > 0 && (
                <Dialog open={isAddToStockDialogOpen} onOpenChange={setIsAddToStockDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <PackagePlus className="mr-2 h-4 w-4" /> Agregar Items a Stock
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <AddToStockForm
                      orderId={order.id}
                      orderItems={initialOrderItems}
                      allProductLeads={allProductLeads}
                      onClose={() => {
                        setIsAddToStockDialogOpen(false)
                        refreshOrderData() // Refrescar datos del pedido y productos
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}
              {order.status === "recibido" && initialOrderItems.length === 0 && (
                <p className="text-sm text-muted-foreground">Añade items al pedido para poder ingresarlos al stock.</p>
              )}
              {order.status !== "recibido" && (
                <p className="text-sm text-muted-foreground">
                  Cambia el estado a &quot;Recibido&quot; para agregar items al stock.
                </p>
              )}
              <hr className="my-3" />
              <p className="text-sm font-medium">Cálculo de Costos Finales</p>
              <p className="text-xs text-muted-foreground pb-1">
                Calcula el costo final de los productos una vez añadidos los items y costos de importación.
              </p>
              <Button className="w-full" disabled>
                <DollarSign className="mr-2 h-4 w-4" /> Calcular Costos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documentos</CardTitle>
              <Button variant="outline" size="sm" disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Documento
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Próximamente...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
  className,
}: { icon?: React.ElementType; label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-sm", className)}>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground flex items-center">
        {Icon && <Icon className="mr-1.5 h-4 w-4 text-muted-foreground" />}
        {value}
      </span>
    </div>
  )
}
