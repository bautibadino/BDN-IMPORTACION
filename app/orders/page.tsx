"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  MoreHorizontal, 
  PlusCircle, 
  PackageSearch, 
  Search, 
  Grid3X3, 
  List, 
  Package, 
  TrendingUp, 
  Clock, 
  Truck,
  Eye,
  Edit,
  Activity,
  Calendar,
  Anchor,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/app/components/page-header"
import { getOrdersAction, getProductLeadsWithDetailsAction } from "./actions"
import type { Order } from "@/lib/types"
import type { ProductLeadWithDetails } from "@/lib/store"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { OrderForm } from "./components/order-form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [allProductLeads, setAllProductLeads] = useState<ProductLeadWithDetails[]>([])
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [dataVersion, setDataVersion] = useState(0)
  const refreshData = () => setDataVersion((v) => v + 1)

  useEffect(() => {
    async function loadInitialData() {
      const [ordersData, leadsData] = await Promise.all([getOrdersAction(), getProductLeadsWithDetailsAction()])
      const sortedOrders = ordersData.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      setOrders(sortedOrders)
      setFilteredOrders(sortedOrders)
      setAllProductLeads(leadsData)
    }
    loadInitialData()
  }, [dataVersion])

  // Filtros y búsqueda
  useEffect(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.incoterm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.forwarder?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedStatus) {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, selectedStatus])

  const handleCloseOrderForm = () => {
    setIsOrderFormOpen(false)
    refreshData()
  }

  const getStatusVariant = (status: Order["status"]): "default" | "secondary" | "destructive" | "outline" => {
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

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "recibido":
        return "text-green-600 bg-green-50 border-green-200"
      case "embarcado":
      case "en_tránsito":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "pagado":
      case "en_producción":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "cancelado":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  // Obtener estados únicos para el filtro
  const uniqueStatuses = [...new Set(orders.map(o => o.status))].filter(Boolean)

  // Estadísticas
  const stats = {
    total: orders.length,
    pending: orders.filter(o => ["borrador", "pendiente_pago"].includes(o.status)).length,
    inProgress: orders.filter(o => ["pagado", "en_producción", "listo_embarque", "embarcado", "en_tránsito", "en_aduana"].includes(o.status)).length,
    completed: orders.filter(o => o.status === "recibido").length,
    maritime: orders.filter(o => o.shipmentType === "marítimo").length
  }

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {order.orderNumber}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(order.orderDate).toLocaleDateString('es-ES')}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={getStatusVariant(order.status)} className={`capitalize ${getStatusColor(order.status)}`}>
              {order.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Anchor className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Incoterm:</span>
              <span className="font-medium">{order.incoterm}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Envío:</span>
              <span className="font-medium capitalize">{order.shipmentType}</span>
            </div>
          </div>
          
          {order.forwarder && (
            <div className="text-sm">
              <span className="text-muted-foreground">Forwarder: </span>
              <span className="font-medium">{order.forwarder}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Link href={`/orders/${order.id}`}>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Eye className="h-3 w-3 mr-1" />
                Ver detalles
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/orders/${order.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-col gap-6">
        <PageHeader title="Pedidos de Importación" description="Gestiona tus órdenes de compra a proveedores.">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="gap-1"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-1"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setIsOrderFormOpen(true)}
              disabled={allProductLeads.length === 0}
            >
              <PlusCircle className="h-4 w-4" /> 
              Nuevo Pedido
            </Button>
          </div>
        </PageHeader>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pedidos</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En Proceso</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completados</p>
                  <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Truck className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marítimos</p>
                  <p className="text-2xl font-bold text-indigo-700">{stats.maritime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mensaje de advertencia si no hay leads */}
      {allProductLeads.length === 0 && (
        <Card className="border-2 border-dashed border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <PackageSearch className="h-12 w-12 text-amber-600 mb-4" />
            <h3 className="text-lg font-medium text-amber-900 mb-2">No hay leads de producto</h3>
            <p className="text-sm text-amber-700 text-center mb-4">
              Carga leads de producto para poder crear pedidos.
            </p>
            <Button asChild variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              <Link href="/leads">
                <Package className="h-4 w-4 mr-2" />
                Ir a Leads
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filtros y búsqueda */}
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-0 bg-white/70 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      {orders.length === 0 && allProductLeads.length > 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PackageSearch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No hay pedidos aún</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Crea tu primer pedido para empezar a gestionar tus importaciones.
            </p>
            <Button size="sm" className="gap-1 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => setIsOrderFormOpen(true)}>
              <PlusCircle className="h-4 w-4" /> Crear Nuevo Pedido
            </Button>
          </CardContent>
        </Card>
      ) : filteredOrders.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <TableHead className="font-semibold">Nº Pedido</TableHead>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Incoterm</TableHead>
                  <TableHead className="font-semibold">Tipo Envío</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200">
                    <TableCell className="font-medium">
                      <Link href={`/orders/${order.id}`} className="hover:underline text-blue-600 hover:text-blue-800 transition-colors">
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)} className={`capitalize ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Anchor className="h-3 w-3 text-muted-foreground" />
                        {order.incoterm}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 capitalize">
                        <Truck className="h-3 w-3 text-muted-foreground" />
                        {order.shipmentType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon" className="hover:bg-blue-50">
                        <Link href={`/orders/${order.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No se encontraron pedidos</h3>
            <p className="text-sm text-muted-foreground text-center">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isOrderFormOpen} onOpenChange={setIsOrderFormOpen}>
        <DialogContent className="max-w-3xl">
          <OrderForm onClose={handleCloseOrderForm} allProductLeads={allProductLeads} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
