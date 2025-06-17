"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import type { OrderItemFormData, ProductLead } from "@/lib/types"
import { addOrderItemAction } from "../actions" // Asumimos que está en app/importacion/importacion/actions.ts
import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react"

const orderItemFormSchema = z.object({
  productLeadId: z.string({ required_error: "Debes seleccionar un producto." }),
  quantity: z.coerce.number().int().positive("La cantidad debe ser un entero positivo."),
  unitPriceUsd: z.coerce.number().positive("El precio unitario debe ser positivo."),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
})

type OrderItemFormValues = z.infer<typeof orderItemFormSchema>

interface OrderItemFormProps {
  orderId: string
  productLeads: ProductLead[] // Lista de leads disponibles
  // orderItem?: OrderItem; // Para modo edición (TODO)
  onClose: () => void
}

export function OrderItemForm({ orderId, productLeads, onClose }: OrderItemFormProps) {
  const { toast } = useToast()
  // const isEditMode = !!orderItem; // TODO

  const form = useForm<OrderItemFormValues>({
    resolver: zodResolver(orderItemFormSchema),
    defaultValues: {
      // ...orderItem, // Para edición
      quantity: 1,
      discountPercent: 0,
    },
  })

  const selectedProductLeadId = form.watch("productLeadId")

  useEffect(() => {
    if (selectedProductLeadId) {
      const selectedLead = productLeads.find((pl) => pl.id === selectedProductLeadId)
      if (selectedLead && selectedLead.referencePriceUsd) {
        form.setValue("unitPriceUsd", selectedLead.referencePriceUsd, { shouldValidate: true })
      }
    }
  }, [selectedProductLeadId, productLeads, form])

  async function onSubmit(data: OrderItemFormValues) {
    const formData: OrderItemFormData = {
      ...data,
      orderId,
    }
    const result = await addOrderItemAction(formData) // Asumimos que addOrderItemAction existe

    if (result.success) {
      toast({ title: "Éxito", description: "Item añadido al pedido." })
      onClose()
    } else {
      toast({ title: "Error", description: result.message || "No se pudo añadir el item.", variant: "destructive" })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Añadir Item al Pedido</DialogTitle>
        {/* <DialogTitle>{isEditMode ? "Editar Item" : "Añadir Item al Pedido"}</DialogTitle> */}
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="productLeadId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Producto (Lead)*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto lead" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {productLeads.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.name} (Ref: ${pl.referencePriceUsd?.toFixed(2) || "N/A"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad*</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unitPriceUsd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio Unitario (USD)*</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discountPercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descuento (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Guardando..." : "Añadir Item"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
