"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategorySelector } from "@/components/categories/category-selector"
import { Badge } from "@/components/ui/badge"
import type { OrderItem, ProductLead, ProductFormData } from "@/lib/types"
import { createOrUpdateProductFromLeadWithCategoriesAction } from "@/app/comercializacion/productos/actions"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getOrderCostBreakdownAction } from "../../actions"
import type { CostBreakdown } from "@/lib/costs"
import { getUsdToArsRate, DEFAULT_MARKUP_PERCENTAGE } from "@/lib/settings"
import { Package, Tag, DollarSign, Calculator } from "lucide-react"

const stockItemSchema = z.object({
  productLeadId: z.string(),
  productName: z.string(),
  orderedQuantity: z.number(),
  receivedQuantity: z.coerce.number().int().nonnegative("Debe ser >= 0"),
  finalUnitCostUsd: z.coerce.number().positive("Costo > 0"),
  markupPercentage: z.coerce.number().min(0, "Margen >= 0"),
  location: z.string().optional(),
  internalCode: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  primaryCategoryId: z.string().optional(),
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

interface AddToStockWithCategoriesFormProps {
  orderId: string
  orderItems: OrderItem[]
  allProductLeads: ProductLead[]
  order: any
  onClose: () => void
}

export function AddToStockWithCategoriesForm({ 
  orderId, 
  orderItems, 
  allProductLeads, 
  order, 
  onClose 
}: AddToStockWithCategoriesFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([])
  const [loadingCosts, setLoadingCosts] = useState(true)
  const [currentTab, setCurrentTab] = useState("0")

  // Verificar si la orden ya fue procesada
  if (order?.isProcessedToStock) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Orden Ya Procesada</DialogTitle>
          <DialogDescription>
            Esta orden ya fue procesada a stock anteriormente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✅ Items ya agregados a stock</p>
            <p className="text-green-600 text-sm mt-2">
              Procesado el {order.processedAt ? 
                new Date(order.processedAt).toLocaleDateString() : 
                "anteriormente"
              }
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </>
    )
  }

  // Cargar los costos calculados al montar el componente
  useEffect(() => {
    async function loadCosts() {
      try {
        const result = await getOrderCostBreakdownAction(orderId)
        if (result.success && result.data) {
          setCostBreakdown(result.data.items)
        }
      } catch (error) {
        console.error("Error loading cost breakdown:", error)
        toast({
          title: "Advertencia",
          description: "No se pudieron cargar los costos calculados. Se usarán precios FOB.",
          variant: "destructive",
        })
      } finally {
        setLoadingCosts(false)
      }
    }
    loadCosts()
  }, [orderId, toast])

  const initialItemsToStock = orderItems.map((item) => {
    const lead = allProductLeads.find((pl) => pl.id === item.productLeadId)
    const costItem = costBreakdown.find((ci) => ci.productLeadId === item.productLeadId)
    
    const finalUnitCostUsd = costItem?.finalUnitCostUsd || item.unitPriceUsd
    
    return {
      productLeadId: item.productLeadId,
      productName: lead?.name || "Producto Desconocido",
      orderedQuantity: item.quantity,
      receivedQuantity: item.quantity,
      finalUnitCostUsd: finalUnitCostUsd,
      markupPercentage: DEFAULT_MARKUP_PERCENTAGE,
      location: "deposito_central",
      internalCode: "",
      categoryIds: [],
      primaryCategoryId: undefined,
    }
  })

  const form = useForm<AddToStockFormValues>({
    resolver: zodResolver(addToStockFormSchema),
    defaultValues: {
      itemsToStock: initialItemsToStock,
    },
  })

  // Actualizar el formulario cuando se carguen los costos
  useEffect(() => {
    if (!loadingCosts) {
      const updatedItemsToStock = orderItems.map((item) => {
        const lead = allProductLeads.find((pl) => pl.id === item.productLeadId)
        const costItem = costBreakdown.find((ci) => ci.productLeadId === item.productLeadId)
        
        const finalUnitCostUsd = costItem?.finalUnitCostUsd || item.unitPriceUsd
        
        return {
          productLeadId: item.productLeadId,
          productName: lead?.name || "Producto Desconocido",
          orderedQuantity: item.quantity,
          receivedQuantity: item.quantity,
          finalUnitCostUsd: finalUnitCostUsd,
          markupPercentage: DEFAULT_MARKUP_PERCENTAGE,
          location: "deposito_central",
          internalCode: "",
          categoryIds: [],
          primaryCategoryId: undefined,
        }
      })
      
      form.reset({ itemsToStock: updatedItemsToStock })
    }
  }, [loadingCosts, costBreakdown, orderItems, allProductLeads, form])

  const { fields } = useFieldArray({
    control: form.control,
    name: "itemsToStock",
  })

  const watchedItems = form.watch("itemsToStock")

  const handleCategoriesChange = (index: number, categoryIds: string[], primaryCategoryId?: string) => {
    form.setValue(`itemsToStock.${index}.categoryIds`, categoryIds)
    form.setValue(`itemsToStock.${index}.primaryCategoryId`, primaryCategoryId)
  }

  async function onSubmit(data: AddToStockFormValues) {
    setIsProcessing(true)
    let productsProcessedCount = 0
    let productsFailedCount = 0
    const successMessages: string[] = []

    for (const item of data.itemsToStock) {
      if (item.receivedQuantity <= 0) continue

      const productFormData = {
        productLeadId: item.productLeadId,
        name: item.productName,
        finalUnitCostUsd: item.finalUnitCostUsd,
        markupPercentage: item.markupPercentage,
        stock: item.receivedQuantity,

        location: item.location,
        internalCode: item.internalCode,
        categoryIds: item.categoryIds,
        primaryCategoryId: item.primaryCategoryId,
      }

      const result = await createOrUpdateProductFromLeadWithCategoriesAction(productFormData)
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
      // Marcar la orden como procesada
      try {
        console.log("Attempting to mark order as processed:", orderId)
        const { markOrderAsProcessedAction } = await import("../actions")
        const result = await markOrderAsProcessedAction(orderId)
        console.log("Mark order result:", result)
        if (!result.success) {
          console.error("Error marking order as processed:", result.message)
        } else {
          console.log("Order marked as processed successfully")
        }
      } catch (error) {
        console.error("Error marking order as processed:", error)
      }

      toast({
        title: "Operación Completada",
        description: `${productsProcessedCount} item(s) procesados para stock con categorías. ${
          productsFailedCount > 0 ? `${productsFailedCount} con errores.` : ""
        }`,
        duration: 8000,
      })
      onClose()
      router.refresh()
    } else if (productsFailedCount > 0 && productsProcessedCount === 0) {
      toast({
        title: "Error Total",
        description: "Ningún item pudo ser procesado para stock.",
        variant: "destructive",
      })
    }
  }

  const USD_TO_ARS_RATE = getUsdToArsRate()

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Agregar Items al Stock con Categorías
        </DialogTitle>
        <DialogDescription>
          Configura cada producto recibido y asigna categorías para una mejor organización
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[80vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="0" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos
                </TabsTrigger>
                <TabsTrigger value="1" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categorías
                </TabsTrigger>
                <TabsTrigger value="2" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Resumen
                </TabsTrigger>
              </TabsList>

              <TabsContent value="0" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Configuración de Productos
                    </CardTitle>
                    <CardDescription>
                      Ajusta las cantidades, precios y códigos internos de los productos recibidos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="w-20">Pedido</TableHead>
                            <TableHead className="w-24">Recibido</TableHead>
                            <TableHead className="w-28">Costo USD</TableHead>
                            <TableHead className="w-24">Margen %</TableHead>
                            <TableHead className="w-32">Ubicación</TableHead>
                            <TableHead className="w-32">Código</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">
                                {watchedItems[index]?.productName}
                              </TableCell>
                              <TableCell className="text-center">
                                {watchedItems[index]?.orderedQuantity}
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`itemsToStock.${index}.receivedQuantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} type="number" min="0" className="w-20" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`itemsToStock.${index}.finalUnitCostUsd`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} type="number" step="0.01" className="w-24" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`itemsToStock.${index}.markupPercentage`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} type="number" step="0.1" className="w-20" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`itemsToStock.${index}.location`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} placeholder="Ubicación" className="w-28" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`itemsToStock.${index}.internalCode`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} placeholder="Código" className="w-28" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="1" className="space-y-4">
                <div className="grid gap-4">
                  {fields.map((field, index) => (
                    <Card key={field.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            {watchedItems[index]?.productName}
                          </span>
                          <Badge variant="outline">
                            Cantidad: {watchedItems[index]?.receivedQuantity}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CategorySelector
                          selectedCategoryIds={watchedItems[index]?.categoryIds || []}
                          primaryCategoryId={watchedItems[index]?.primaryCategoryId}
                          onCategoriesChange={(categoryIds, primaryCategoryId) => 
                            handleCategoriesChange(index, categoryIds, primaryCategoryId)
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="2" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Resumen de Procesamiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {watchedItems.map((item, index) => {
                        if (item.receivedQuantity <= 0) return null
                        
                        const finalUnitCostArs = item.finalUnitCostUsd * USD_TO_ARS_RATE
                        const finalPriceArs = finalUnitCostArs * (1 + item.markupPercentage / 100)
                        const totalCostUsd = item.finalUnitCostUsd * item.receivedQuantity
                        
                        return (
                          <div key={index} className="p-4 border rounded-lg space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{item.productName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Cantidad: {item.receivedQuantity} unidades
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${finalPriceArs.toFixed(2)} ARS</p>
                                <p className="text-sm text-muted-foreground">
                                  Costo: ${item.finalUnitCostUsd.toFixed(2)} USD
                                </p>
                              </div>
                            </div>
                            
                            {item.categoryIds && item.categoryIds.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.categoryIds.map((categoryId) => (
                                  <Badge key={categoryId} variant="secondary" className="text-xs">
                                    Categoría {categoryId === item.primaryCategoryId ? '(Principal)' : ''}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Total USD: ${totalCostUsd.toFixed(2)}</p>
                              <p>Margen: {item.markupPercentage}%</p>
                              {item.location && <p>Ubicación: {item.location}</p>}
                              {item.internalCode && <p>Código: {item.internalCode}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancelar
              </Button>
              <div className="flex gap-2">
                {currentTab !== "2" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentTab("2")}
                    disabled={isProcessing}
                  >
                    Ver Resumen
                  </Button>
                )}
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? "Procesando..." : "Agregar al Stock"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </div>
    </>
  )
} 