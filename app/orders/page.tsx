"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MoreHorizontal, PlusCircle, PackageSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/app/components/page-header"
import { getOrdersAction, getProductLeadsWithDetailsAction } from "./actions"
import type { Order, ProductLeadWithDetails } from "@/lib/types"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { OrderForm } from "./components/order-form"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [allProductLeads, setAllProductLeads] = useState<ProductLeadWithDetails[]>([]) // Estado para los leads
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)
  const refreshData = () => setDataVersion((v) => v + 1)

  useEffect(() => {
    async function loadInitialData() {
      const [ordersData, leadsData] = await Promise.all([getOrdersAction(), getProductLeadsWithDetailsAction()])
      setOrders(ordersData.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()))
      setAllProductLeads(leadsData)
    }
    loadInitialData()
  }, [dataVersion])

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

  return (
    <>
      <PageHeader title="Pedidos de Importación" description="Gestiona tus órdenes de compra a proveedores.">
        <Button
          size="sm"
          className="gap-1"
          onClick={() => setIsOrderFormOpen(true)}
          disabled={allProductLeads.length === 0}
        >
          <PlusCircle className="h-4 w-4" /> Nuevo Pedido
        </Button>
        {allProductLeads.length === 0 && (
          <p className="text-xs text-muted-foreground">Carga leads de producto para poder crear pedidos.</p>
        )}
      </PageHeader>

      {orders.length === 0 && allProductLeads.length > 0 ? ( // Modificado para mostrar solo si hay leads
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No hay pedidos aún</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Crea tu primer pedido para empezar a gestionar tus importaciones.
          </p>
          <Button size="sm" className="gap-1" onClick={() => setIsOrderFormOpen(true)}>
            <PlusCircle className="h-4 w-4" /> Crear Nuevo Pedido
          </Button>
        </div>
      ) : orders.length > 0 ? ( // Mostrar tabla solo si hay pedidos
        <div className="border rounded-lg w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Pedido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Incoterm</TableHead>
                <TableHead>Tipo Envío</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <Link href={`/orders/${order.id}`} className="hover:underline text-primary">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)} className="capitalize">
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.incoterm}</TableCell>
                  <TableCell className="capitalize">{order.shipmentType}</TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/orders/${order.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      <Dialog open={isOrderFormOpen} onOpenChange={setIsOrderFormOpen}>
        <DialogContent className="max-w-3xl">
          {" "}
          {/* Aumentar ancho del modal */}
          <OrderForm onClose={handleCloseOrderForm} allProductLeads={allProductLeads} />
        </DialogContent>
      </Dialog>
    </>
  )
}
