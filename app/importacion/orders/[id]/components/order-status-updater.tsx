"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import type { Order } from "@/lib/types"
import { updateOrderStatusAction } from "../../actions" // Ajusta la ruta si es necesario

interface OrderStatusUpdaterProps {
  orderId: string
  currentStatus: Order["status"]
}

const availableStatuses: Order["status"][] = [
  "borrador",
  "pendiente_pago",
  "pagado",
  "embarcado",
  "en_transito",
  "recibido",
  // "en_produccion", // Estos son más intermedios, los omito por ahora para el selector manual
  // "listo_embarque",
  // "en_aduana",
  // "cancelado", // Cancelar podría ser una acción separada
]

export function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const [selectedStatus, setSelectedStatus] = useState<Order["status"]>(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) return

    setIsLoading(true)
    const result = await updateOrderStatusAction(orderId, selectedStatus)
    setIsLoading(false)

    if (result.success) {
      toast({ title: "Éxito", description: result.message })
      // La revalidación de la página padre debería actualizar currentStatus,
      // pero podemos setearlo aquí para una UI más rápida si es necesario.
      // No es estrictamente necesario si la página se recarga/revalida bien.
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
      setSelectedStatus(currentStatus) // Revertir si falla
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as Order["status"])}>
        <SelectTrigger className="w-[200px] bg-background">
          <SelectValue placeholder="Cambiar estado" />
        </SelectTrigger>
        <SelectContent>
          {availableStatuses.map((status) => (
            <SelectItem key={status} value={status} className="capitalize">
              {status.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleStatusChange} disabled={isLoading || selectedStatus === currentStatus}>
        {isLoading ? "Actualizando..." : "Actualizar Estado"}
      </Button>
    </div>
  )
}
