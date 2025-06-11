"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import type { Order, ProductLeadWithDetails } from "@/lib/types"
import { saveOrderAction } from "../actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useMemo } from "react"

// Schema para los datos principales del pedido
const orderBaseFormSchema = z.object({
  orderNumber: z.string().min(1, "El número de pedido es requerido."),
  orderDate: z.string().min(1, "La fecha es requerida."),
  shipmentType: z.enum(["aéreo", "marítimo", "terrestre"]),
  incoterm: z.enum(["EXW", "FOB", "CIF", "DDP"]),
  status: z.enum([
    "borrador",
    "pendiente_pago",
    "pagado",
    "en_produccion",
    "listo_embarque",
    "embarcado",
    "en_transito",
    "en_aduana",
    "recibido",
    "cancelado",
  ]),
  forwarder: z.string().optional(),
  trackingCode: z.string().optional(),
  estimatedArrival: z.string().optional(),
  portOfOrigin: z.string().optional(),
  portOfDestination: z.string().optional(),
})

const orderItemSchema = z.object({
  productLeadId: z.string(),
  productLeadName: z.string(),
  supplierName: z.string(),
  referencePriceUsdDisplay: z.string(),
  latestStatusDisplay: z.string().optional(),
  moqDisplay: z.string(),
  quantity: z.coerce.number().int().positive("Cantidad > 0"),
  unitPriceUsd: z.coerce.number().positive("Precio > 0"),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
})

const fullOrderFormSchema = orderBaseFormSchema.extend({
  items: z.array(orderItemSchema).min(1, "Debes seleccionar al menos un producto."),
})

type FullOrderFormValues = z.infer<typeof fullOrderFormSchema>

interface OrderFormProps {
  order?: Order | null
  allProductLeads: ProductLeadWithDetails[]
  onClose: () => void
}

export function OrderForm({ order, allProductLeads, onClose }: OrderFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const isEditMode = !!order
  const [searchTerm, setSearchTerm] = useState("")

  const form = useForm<FullOrderFormValues>({
    resolver: zodResolver(fullOrderFormSchema),
    defaultValues: {
      orderNumber: order?.orderNumber || `PO-${new Date().getFullYear()}-`,
      orderDate: order?.orderDate
        ? new Date(order.orderDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      shipmentType: order?.shipmentType || "marítimo",
      incoterm: order?.incoterm || "FOB",
      status: order?.status || "borrador",
      items: [],
      forwarder: order?.forwarder || "",
      trackingCode: order?.trackingCode || "",
      estimatedArrival: order?.estimatedArrival ? new Date(order.estimatedArrival).toISOString().split("T")[0] : "",
      portOfOrigin: order?.portOfOrigin || "",
      portOfDestination: order?.portOfDestination || "",
    },
  })

  // Log para ver errores de validación del formulario en cada render
  console.log("OrderForm - formState.errors:", form.formState.errors)

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const filteredProductLeads = useMemo(() => {
    if (!searchTerm) return allProductLeads
    return allProductLeads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.tags?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [allProductLeads, searchTerm])

  const handleSelectProductLead = (lead: ProductLeadWithDetails) => {
    if (fields.some((item) => item.productLeadId === lead.id)) {
      toast({ title: "Producto ya añadido", description: `${lead.name} ya está en la lista.`, variant: "default" })
      return
    }
    append({
      productLeadId: lead.id,
      productLeadName: lead.name,
      supplierName: lead.supplierName,
      referencePriceUsdDisplay: lead.referencePriceUsd?.toFixed(2) || "N/A",
      latestStatusDisplay: lead.latestStatus || "N/A",
      moqDisplay: lead.moq?.toString() || "N/A",
      quantity: lead.moq || 1,
      unitPriceUsd: lead.referencePriceUsd || 0,
      discountPercent: 0,
    })
  }

  async function onSubmit(data: FullOrderFormValues) {
    console.log("OrderForm: onSubmit triggered.") // LOG 1: ¿Se llama a onSubmit?
    console.log("OrderForm: Form data:", data) // LOG 2: ¿Qué datos se envían?

    const orderData = orderBaseFormSchema.parse(data)
    const itemsData = data.items.map((item) => ({
      productLeadId: item.productLeadId,
      quantity: item.quantity,
      unitPriceUsd: item.unitPriceUsd,
      discountPercent: item.discountPercent,
    }))

    console.log("OrderForm: Parsed orderData:", orderData) // LOG 3
    console.log("OrderForm: Parsed itemsData:", itemsData) // LOG 4

    try {
      const result = await saveOrderAction(order?.id || null, orderData, itemsData)
      console.log("OrderForm: saveOrderAction result:", result) // LOG 5: ¿Qué devuelve la action?

      if (result.success && result.order) {
        toast({ title: "Éxito", description: result.message })
        onClose()
        router.push(`/orders/${result.order.id}`)
      } else {
        toast({ title: "Error", description: result.message || "No se pudo crear el pedido.", variant: "destructive" })
      }
    } catch (error) {
      console.error("OrderForm: Error calling saveOrderAction:", error) // LOG 6: ¿Hay error al llamar la action?
      toast({
        title: "Error Crítico",
        description: "Ocurrió un error inesperado al procesar el pedido.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Editar Pedido" : "Nuevo Pedido de Importación"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <ScrollArea className="h-[calc(80vh-200px)] pr-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground mb-2">Datos del Pedido</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Pedido*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Pedido*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shipmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Envío*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="marítimo">Marítimo</SelectItem>
                          <SelectItem value="aéreo">Aéreo</SelectItem>
                          <SelectItem value="terrestre">Terrestre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="incoterm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incoterm*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EXW">EXW</SelectItem>
                          <SelectItem value="FOB">FOB</SelectItem>
                          <SelectItem value="CIF">CIF</SelectItem>
                          <SelectItem value="DDP">DDP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Estado*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(
                            [
                              "borrador",
                              "pendiente_pago",
                              "pagado",
                              "en_produccion",
                              "listo_embarque",
                              "embarcado",
                              "en_transito",
                              "en_aduana",
                              "recibido",
                              "cancelado",
                            ] as Order["status"][]
                          ).map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s.replace(/_/g, " ")}
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
                  name="forwarder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forwarder</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trackingCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedArrival"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Llegada Estimada</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="portOfOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puerto Origen</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="portOfDestination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puerto Destino</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <h3 className="text-lg font-medium text-foreground pt-4 mb-2">Seleccionar Productos</h3>
              <Input
                placeholder="Buscar producto por nombre, proveedor, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <ScrollArea className="h-[200px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Precio Ref.</TableHead>
                      <TableHead>Estado Lead</TableHead>
                      <TableHead>MOQ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProductLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleSelectProductLead(lead)}
                            disabled={fields.some((item) => item.productLeadId === lead.id)}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>{lead.name}</TableCell>
                        <TableCell>{lead.supplierName}</TableCell>
                        <TableCell>${lead.referencePriceUsd?.toFixed(2) || "N/A"}</TableCell>
                        <TableCell className="capitalize">{lead.latestStatus || "N/A"}</TableCell>
                        <TableCell>{lead.moq || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredProductLeads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No se encontraron productos con ese criterio.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              {/* CORRECCIÓN AQUÍ: Usar <p> para errores de array */}
              {form.formState.errors.items &&
                typeof form.formState.errors.items === "object" &&
                !Array.isArray(form.formState.errors.items) &&
                form.formState.errors.items.message && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.items.message}</p>
                )}

              {fields.length > 0 && (
                <>
                  <h3 className="text-lg font-medium text-foreground pt-4 mb-2">Items del Pedido</h3>
                  <ScrollArea className="h-[250px] border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="w-[100px]">Cantidad*</TableHead>
                          <TableHead className="w-[120px]">Precio USD*</TableHead>
                          <TableHead className="w-[100px]">Desc. %</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <p className="font-medium">{field.productLeadName}</p>
                              <p className="text-xs text-muted-foreground">Prov: {field.supplierName}</p>
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field: itemField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input type="number" {...itemField} />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.unitPriceUsd`}
                                render={({ field: itemField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input type="number" step="0.01" {...itemField} />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.discountPercent`}
                                render={({ field: itemField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input type="number" step="0.1" {...itemField} />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Guardando..." : "Crear Pedido"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
