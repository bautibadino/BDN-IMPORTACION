"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form" // No se usa FormLabel aquí directamente
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import type { OrderItem, ProductLead, ProductFormData } from "@/lib/types"
import { createOrUpdateProductFromLeadAction } from "@/app/products/actions"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { useState } from "react"

const USD_TO_ARS_RATE = 1250.0

const stockItemSchema = z.object({
  productLeadId: z.string(),
  productName: z.string(),
  orderedQuantity: z.number(),
  receivedQuantity: z.coerce.number().int().nonnegative("Debe ser >= 0"),
  finalUnitCostUsd: z.coerce.number().positive("Costo > 0"),
  markupPercentage: z.coerce.number().min(0, "Margen >= 0"),
  location: z.string().optional(),
  internalCode: z.string().optional(),
})

const addToStockFormSchema = z.object({
  itemsToStock: z
    .array(stockItemSchema)
    .refine(
      (items) => items.some((item) => item.receivedQuantity > 0),
      "Debes ingresar una cantidad recibida para al menos un item.",
    ),
})

type AddToStockFormValues = z.infer<typeof addToStockFormSchema>

interface AddToStockFormProps {
  orderId: string
  orderItems: OrderItem[]
  allProductLeads: ProductLead[]
  onClose: () => void
}

export function AddToStockForm({ orderId, orderItems, allProductLeads, onClose }: AddToStockFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const initialItemsToStock = orderItems.map((item) => {
    const lead = allProductLeads.find((pl) => pl.id === item.productLeadId)
    return {
      productLeadId: item.productLeadId,
      productName: lead?.name || "Producto Desconocido",
      orderedQuantity: item.quantity,
      receivedQuantity: item.quantity,
      finalUnitCostUsd: item.unitPriceUsd,
      markupPercentage: 50,
      location: "deposito_central",
      internalCode: "",
    }
  })

  const form = useForm<AddToStockFormValues>({
    resolver: zodResolver(addToStockFormSchema),
    defaultValues: {
      itemsToStock: initialItemsToStock,
    },
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: "itemsToStock",
  })

  const watchedItems = form.watch("itemsToStock")

  async function onSubmit(data: AddToStockFormValues) {
    setIsProcessing(true)
    let productsProcessedCount = 0
    let productsFailedCount = 0
    const successMessages: string[] = []

    for (const item of data.itemsToStock) {
      if (item.receivedQuantity <= 0) continue

      const productFormData: ProductFormData & { productLeadId: string; location?: string; internalCode?: string } = {
        productLeadId: item.productLeadId,
        name: item.productName,
        finalUnitCostUsd: item.finalUnitCostUsd,
        markupPercentage: item.markupPercentage,
        stock: item.receivedQuantity,
        mlListingUrl: allProductLeads.find((pl) => pl.id === item.productLeadId)?.sourceUrl || "",
        location: item.location,
        internalCode: item.internalCode,
      }

      const result = await createOrUpdateProductFromLeadAction(productFormData)
      if (result.success && result.product) {
        productsProcessedCount++
        successMessages.push(result.message || `${result.product.name} procesado.`)
      } else {
        productsFailedCount++
        toast({
          title: `Error al procesar ${item.productName}`,
          description: result.message || "Error desconocido.",
          variant: "destructive",
        })
      }
    }
    setIsProcessing(false)

    if (productsProcessedCount > 0) {
      toast({
        title: "Operación Completada",
        description: `${productsProcessedCount} item(s) procesados para stock. ${
          productsFailedCount > 0 ? `${productsFailedCount} con errores.` : ""
        }`,
        duration: successMessages.length > 1 ? 8000 : 5000,
      })
    } else if (productsFailedCount > 0 && productsProcessedCount === 0) {
      toast({
        title: "Error Total",
        description: "Ningún item pudo ser procesado para stock.",
        variant: "destructive",
      })
      return
    }

    if (productsProcessedCount > 0) {
      onClose()
      router.refresh()
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Agregar Items Recibidos al Stock</DialogTitle>
        <DialogDescription>
          Confirma las cantidades recibidas, costos finales y márgenes para los productos de este pedido.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <ScrollArea className="h-[calc(70vh-150px)] pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-[100px]">Recibido*</TableHead>
                  <TableHead className="w-[120px]">Costo USD*</TableHead>
                  <TableHead className="w-[100px]">Margen %*</TableHead>
                  <TableHead className="w-[150px]">Precio ARS (Calc.)</TableHead>
                  <TableHead className="w-[150px]">Ubicación</TableHead>
                  <TableHead className="w-[150px]">Cód. Interno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const currentItem = watchedItems[index]
                  const finalUnitCostArs = currentItem.finalUnitCostUsd * USD_TO_ARS_RATE
                  const finalPriceArs = finalUnitCostArs * (1 + currentItem.markupPercentage / 100)

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <p className="font-medium">{currentItem.productName}</p>
                        <p className="text-xs text-muted-foreground">Pedido: {currentItem.orderedQuantity}</p>
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`itemsToStock.${index}.receivedQuantity`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...itemField} disabled={isProcessing} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`itemsToStock.${index}.finalUnitCostUsd`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="0.01" {...itemField} disabled={isProcessing} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`itemsToStock.${index}.markupPercentage`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="0.1" {...itemField} disabled={isProcessing} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        ${finalPriceArs.toFixed(2)}
                        <p className="text-xs text-muted-foreground">Costo ARS: ${finalUnitCostArs.toFixed(2)}</p>
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`itemsToStock.${index}.location`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Ej: Depósito A1" {...itemField} disabled={isProcessing} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`itemsToStock.${index}.internalCode`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Ej: SKU-001" {...itemField} disabled={isProcessing} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
          {/* CORRECCIÓN AQUÍ: Usar <p> para errores de array */}
          {form.formState.errors.itemsToStock &&
            typeof form.formState.errors.itemsToStock === "object" &&
            !Array.isArray(form.formState.errors.itemsToStock) &&
            form.formState.errors.itemsToStock.message && (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.itemsToStock.message}</p>
            )}

          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isProcessing}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isProcessing || form.formState.isSubmitting}>
              {isProcessing ? "Procesando..." : "Confirmar y Agregar a Stock"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
