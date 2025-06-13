"use client" // Convertir a Client Component para manejar estado del Dialog y status

import type React from "react" // Necesario para JSX si no es implícito
import { useState, useEffect, use } from "react" // Para manejar estado del Dialog y datos
import { PageHeader } from "@/app/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  CalendarDays, 
  Truck, 
  Anchor, 
  DollarSign, 
  PlusCircle, 
  PackagePlus,
  ArrowLeft,
  Package,
  FileText,
  Clock,
  MapPin,
  Settings,
  CheckCircle,
  AlertCircle,
  Activity,
  TrendingUp,
  Navigation,
  Plane,
  Ship
} from "lucide-react"
import { OrderItemsSection } from "../components/order-items-section"
import { OrderStatusUpdater } from "./components/order-status-updater"
import { AddToStockForm } from "./components/add-to-stock-form"
import ImportCostForm from "@/components/orders/ImportCostForm"
import CostBreakdown from "@/components/orders/CostBreakdown"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import type { Order, OrderItem, ProductLead } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getOrderByIdAction, getOrderItemsByOrderIdAction, getProductLeadsAction } from "../actions"

// const USD_TO_ARS_RATE = 1250.0 // Ya no es necesario aquí, se usa en AddToStockForm

// Esta página ahora necesita ser un Client Component para manejar el estado del pedido dinámicamente
// y el estado de los diálogos.
export default function OrderDetailPageClient({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [initialOrderItems, setInitialOrderItems] = useState<OrderItem[]>([])
  const [allProductLeads, setAllProductLeads] = useState<ProductLead[]>([])
  const [isAddToStockDialogOpen, setIsAddToStockDialogOpen] = useState(false)
  const [isImportCostDialogOpen, setIsImportCostDialogOpen] = useState(false)
  const [dataVersion, setDataVersion] = useState(0) // Para forzar recarga
  
  // Usar React.use() para unwrap la Promise de params
  const { id } = use(params)

  useEffect(() => {
    async function fetchData() {
      const orderData = await getOrderByIdAction(id)
      setOrder(orderData || null)
      if (orderData) {
        const itemsData = await getOrderItemsByOrderIdAction(id)
        setInitialOrderItems(itemsData)
      }
      const leadsData = await getProductLeadsAction()
      setAllProductLeads(leadsData)
    }
    fetchData()
  }, [id, dataVersion]) // Recargar si cambia el ID o dataVersion

  const refreshOrderData = () => {
    setDataVersion((v) => v + 1)
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Pedido no encontrado</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                El pedido solicitado no existe o ha sido eliminado.
              </p>
              <Button asChild variant="outline">
                <Link href="/orders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Pedidos
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusVariant = (status: Order["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pagado":
      case "embarcado":
      case "recibido":
        return "default"
      case "pendiente_pago":
      case "en_producción":
      case "listo_embarque":
      case "en_tránsito":
      case "en_aduana":
        return "secondary"
      case "cancelado":
        return "destructive"
      case "borrador":
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "recibido":
        return "text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
      case "embarcado":
      case "en_tránsito":
        return "text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
      case "pagado":
      case "en_producción":
        return "text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
      case "cancelado":
        return "text-red-700 bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
      default:
        return "text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
    }
  }

  const getShipmentIcon = (shipmentType: string) => {
    switch (shipmentType) {
      case "aéreo":
        return Plane
      case "marítimo":
        return Ship
      case "terrestre":
        return Truck
      default:
        return Package
    }
  }

  const ShipmentIcon = getShipmentIcon(order.shipmentType)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/30 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                    {order.orderNumber}
                  </h1>
                  <p className="text-gray-600 font-medium">Pedido de Importación</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`${getStatusColor(order.status)} border-0 px-3 py-1 font-semibold capitalize shadow-sm`}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {order.status.replace(/_/g, " ")}
                </Badge>
                
                <Badge variant="outline" className="bg-white/60 border-blue-200 text-blue-700 px-3 py-1">
                  <ShipmentIcon className="h-3 w-3 mr-1" />
                  {order.shipmentType}
                </Badge>
                
                <Badge variant="outline" className="bg-white/60 border-indigo-200 text-indigo-700 px-3 py-1">
                  <Anchor className="h-3 w-3 mr-1" />
                  {order.incoterm}
                </Badge>
                
                <Badge variant="outline" className="bg-white/60 border-gray-200 text-gray-700 px-3 py-1">
                  <CalendarDays className="h-3 w-3 mr-1" />
                  {new Date(order.orderDate).toLocaleDateString('es-ES')}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="bg-white/70 hover:bg-white border-gray-200">
                <Link href="/orders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Información del Pedido */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                        Información del Pedido
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Detalles y datos de envío</p>
                    </div>
                  </div>
                  <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <InfoItem
                    icon={CalendarDays}
                    label="Fecha Pedido"
                    value={new Date(order.orderDate).toLocaleDateString('es-ES')}
                    iconColor="text-blue-500"
                  />
                  <InfoItem 
                    icon={ShipmentIcon} 
                    label="Tipo Envío" 
                    value={order.shipmentType} 
                    className="capitalize" 
                    iconColor="text-green-500"
                  />
                  <InfoItem 
                    icon={Anchor} 
                    label="Incoterm" 
                    value={order.incoterm} 
                    iconColor="text-indigo-500"
                  />
                  {order.forwarder && (
                    <InfoItem 
                      icon={Navigation} 
                      label="Forwarder" 
                      value={order.forwarder} 
                      iconColor="text-purple-500"
                    />
                  )}
                  {order.trackingCode && (
                    <InfoItem 
                      icon={Package} 
                      label="Tracking" 
                      value={order.trackingCode} 
                      iconColor="text-orange-500"
                    />
                  )}
                  {order.estimatedArrival && (
                    <InfoItem
                      icon={Clock}
                      label="Llegada Estimada"
                      value={new Date(order.estimatedArrival).toLocaleDateString('es-ES')}
                      iconColor="text-yellow-500"
                    />
                  )}
                  {order.portOfOrigin && (
                    <InfoItem 
                      icon={MapPin} 
                      label="Puerto Origen" 
                      value={order.portOfOrigin} 
                      iconColor="text-teal-500"
                    />
                  )}
                  {order.portOfDestination && (
                    <InfoItem 
                      icon={MapPin} 
                      label="Puerto Destino" 
                      value={order.portOfDestination} 
                      iconColor="text-cyan-500"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items del Pedido */}
            <OrderItemsSection
              orderId={order.id}
              initialOrderItems={initialOrderItems}
              allProductLeads={allProductLeads}
            />

            {/* Costos de Importación */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
                        Costos de Importación
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Gestiona los costos asociados</p>
                    </div>
                  </div>
                  <Dialog open={isImportCostDialogOpen} onOpenChange={setIsImportCostDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white/70 hover:bg-white border-green-200 text-green-700">
                        <PlusCircle className="mr-2 h-4 w-4" /> 
                        Añadir Costo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <ImportCostForm
                        orderId={order.id}
                        onSuccess={() => {
                          setIsImportCostDialogOpen(false)
                          refreshOrderData()
                        }}
                        onCancel={() => setIsImportCostDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CostBreakdown 
                  orderId={order.id} 
                  order={order} 
                  onOrderUpdated={refreshOrderData}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar derecho */}
          <div className="lg:col-span-1 space-y-8">
            {/* Acciones del Pedido */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-sm">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent">
                      Acciones del Pedido
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Operaciones disponibles</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {order.status === "recibido" && initialOrderItems.length > 0 && !(order as any).isProcessedToStock && (
                  <Dialog open={isAddToStockDialogOpen} onOpenChange={setIsAddToStockDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                        <PackagePlus className="mr-2 h-4 w-4" /> 
                        Agregar Items a Stock
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <AddToStockForm
                        orderId={order.id}
                        orderItems={initialOrderItems}
                        allProductLeads={allProductLeads}
                        order={order}
                        onClose={() => {
                          setIsAddToStockDialogOpen(false)
                          refreshOrderData()
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                )}
                
                {order.status === "recibido" && (order as any).isProcessedToStock && (
                  <div className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl text-center shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-semibold text-green-800">Items agregados a stock</p>
                    </div>
                    <p className="text-xs text-green-600">
                      Procesado el {(order as any).processedAt ? 
                        new Date((order as any).processedAt).toLocaleDateString('es-ES') : 
                        "anteriormente"
                      }
                    </p>
                  </div>
                )}
                
                {order.status === "recibido" && initialOrderItems.length === 0 && (
                  <div className="w-full p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <p className="text-sm font-medium text-amber-800">Sin items</p>
                    </div>
                    <p className="text-xs text-amber-700">
                      Añade items al pedido para poder ingresarlos al stock.
                    </p>
                  </div>
                )}
                
                {order.status !== "recibido" && (
                  <div className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800">Pendiente de recepción</p>
                    </div>
                    <p className="text-xs text-blue-700">
                      Cambia el estado a "Recibido" para agregar items al stock.
                    </p>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-700">Finalizar Orden</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      {order.status === "recibido" 
                        ? "Los costos finales se muestran en la sección de Costos de Importación."
                        : "Cambia el estado a 'Recibido' para ver los costos finales y crear productos."
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-sm">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl bg-gradient-to-r from-orange-900 to-amber-900 bg-clip-text text-transparent">
                        Documentos
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Archivos y documentación</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled className="bg-white/70 border-orange-200 text-orange-400">
                    <PlusCircle className="mr-2 h-4 w-4" /> 
                    Añadir
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Próximamente</p>
                  <p className="text-xs text-muted-foreground mt-1">Funcionalidad de documentos en desarrollo</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
  className,
  iconColor = "text-muted-foreground"
}: { 
  icon?: React.ElementType
  label: string
  value: React.ReactNode
  className?: string
  iconColor?: string 
}) {
  return (
    <div className={cn("group p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-white/30 border border-gray-100 hover:shadow-md transition-all duration-200", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
        </div>
      </div>
    </div>
  )
}
