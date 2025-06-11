"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PlusCircle, MoreVertical, Trash2, Edit3 } from "lucide-react"
import type { OrderItem, ProductLead } from "@/lib/types"
import { OrderItemForm } from "./order-item-form"
import { getOrderItemsByOrderIdAction } from "../actions"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { deleteOrderItemAction } from "../actions"; // TODO
import { useToast } from "@/components/ui/use-toast"

interface OrderItemsSectionProps {
  orderId: string
  initialOrderItems: OrderItem[]
  allProductLeads: ProductLead[] // Todos los leads para el selector
}

export function OrderItemsSection({ orderId, initialOrderItems, allProductLeads }: OrderItemsSectionProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrderItems)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  // const [editingItem, setEditingItem] = useState<OrderItem | null>(null); // TODO
  const { toast } = useToast()

  // Si initialOrderItems cambia (por revalidación de la página padre), actualizamos el estado
  useEffect(() => {
    setOrderItems(initialOrderItems)
  }, [initialOrderItems])

  const handleOpenItemForm = (/*item?: OrderItem*/) => {
    // setEditingItem(item || null); // TODO
    setIsItemFormOpen(true)
  }

  const handleCloseItemForm = async () => {
    setIsItemFormOpen(false)
    // setEditingItem(null);
    // Recargar items después de añadir/editar
    const updatedItems = await getOrderItemsByOrderIdAction(orderId)
    setOrderItems(updatedItems)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("¿Estás seguro de eliminar este item del pedido?")) {
      // const result = await deleteOrderItemAction(itemId); // TODO
      // if (result.success) {
      //   toast({ title: "Item eliminado" });
      //   setOrderItems(prev => prev.filter(item => item.id !== itemId));
      // } else {
      //   toast({ title: "Error", description: result.message, variant: "destructive" });
      // }
      toast({ title: "Funcionalidad pendiente", description: "Eliminar items aún no implementado." })
    }
  }

  const getProductLeadName = (productLeadId: string) => {
    return allProductLeads.find((pl) => pl.id === productLeadId)?.name || "Desconocido"
  }

  const calculateItemSubtotal = (item: OrderItem) => {
    const discountedPrice = item.unitPriceUsd * (1 - (item.discountPercent || 0) / 100)
    return item.quantity * discountedPrice
  }

  const totalOrderValue = orderItems.reduce((acc, item) => acc + calculateItemSubtotal(item), 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Items del Pedido</CardTitle>
        <Button variant="outline" size="sm" onClick={() => handleOpenItemForm()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Item
        </Button>
      </CardHeader>
      <CardContent>
        {orderItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay items en este pedido.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto (Lead)</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio U. (USD)</TableHead>
                <TableHead className="text-right">Desc. (%)</TableHead>
                <TableHead className="text-right">Subtotal (USD)</TableHead>
                <TableHead className="w-[50px]">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{getProductLeadName(item.productLeadId)}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unitPriceUsd.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.discountPercent?.toFixed(1) || "0.0"}%</TableCell>
                  <TableCell className="text-right font-semibold">${calculateItemSubtotal(item).toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenItemForm(/*item*/)} disabled>
                          {" "}
                          {/* TODO: Editar */}
                          <Edit3 className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteItem(item.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {orderItems.length > 0 && (
          <div className="mt-4 pt-4 border-t text-right">
            <p className="text-lg font-semibold">Valor Total Items: ${totalOrderValue.toFixed(2)} USD</p>
          </div>
        )}
      </CardContent>
      <Dialog open={isItemFormOpen} onOpenChange={setIsItemFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <OrderItemForm orderId={orderId} productLeads={allProductLeads} onClose={handleCloseItemForm} />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
