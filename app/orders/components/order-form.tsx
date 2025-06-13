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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/lib/types"
import { saveOrderAction } from "../actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { 
  PlusCircle, 
  Trash2, 
  Package, 
  FileText, 
  Calendar, 
  Truck, 
  Anchor, 
  Navigation, 
  MapPin, 
  Clock, 
  Search,
  Settings,
  DollarSign,
  Hash,
  Save,
  Loader2,
  Sparkles
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useMemo } from "react"
import type { ProductLeadWithDetails as ProductLeadWithDetailsFromStore } from "@/lib/store"

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
    "en_producción",
    "listo_embarque",
    "embarcado",
    "en_tránsito",
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
  allProductLeads: ProductLeadWithDetailsFromStore[]
  onClose: () => void
}

export function OrderForm({ order, allProductLeads, onClose }: OrderFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const isEditMode = !!order
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSelectProductLead = (lead: ProductLeadWithDetailsFromStore) => {
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
    setIsSubmitting(true)
    
    try {
      const orderData = orderBaseFormSchema.parse(data)
      const itemsData = data.items.map((item) => ({
        productLeadId: item.productLeadId,
        quantity: item.quantity,
        unitPriceUsd: item.unitPriceUsd,
        discountPercent: item.discountPercent,
      }))

      const result = await saveOrderAction(order?.id || null, orderData, itemsData)

      if (result.success && result.order) {
        toast({ 
          title: "¡Éxito!", 
          description: result.message,
          className: "bg-green-50 border-green-200 text-green-800"
        })
        onClose()
        router.push(`/orders/${result.order.id}`)
      } else {
        toast({ 
          title: "Error", 
          description: result.message || "No se pudo crear el pedido.", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("OrderForm: Error calling saveOrderAction:", error)
      toast({
        title: "Error Crítico",
        description: "Ocurrió un error inesperado al procesar el pedido.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalItems = fields.length
  const totalQuantity = fields.reduce((sum, item) => sum + (item.quantity || 0), 0)
  const totalValue = fields.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.unitPriceUsd || 0)
    const discount = (item.discountPercent || 0) / 100
    return sum + itemTotal * (1 - discount)
  }, 0)

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30">
      <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-6 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
              {isEditMode ? "Editar Pedido" : "Nuevo Pedido de Importación"}
            </DialogTitle>
            <p className="text-muted-foreground mt-1">
              {isEditMode ? "Modifica los datos del pedido existente" : "Crea un nuevo pedido con productos seleccionados"}
            </p>
          </div>
        </div>
        
        {/* Estadísticas del formulario */}
        {fields.length > 0 && (
          <div className="flex gap-4 mt-4">
            <Badge variant="outline" className="bg-white/70 border-blue-200 text-blue-700">
              <Package className="h-3 w-3 mr-1" />
              {totalItems} productos
            </Badge>
            <Badge variant="outline" className="bg-white/70 border-green-200 text-green-700">
              <Hash className="h-3 w-3 mr-1" />
              {totalQuantity} unidades
            </Badge>
            <Badge variant="outline" className="bg-white/70 border-indigo-200 text-indigo-700">
              <DollarSign className="h-3 w-3 mr-1" />
              ${totalValue.toFixed(2)}
            </Badge>
          </div>
        )}
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
          <ScrollArea className="h-[calc(80vh-250px)] pr-4">
            <div className="space-y-8">
              
              {/* Información Básica */}
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg shadow-sm">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg bg-gradient-to-r from-gray-900 to-slate-900 bg-clip-text text-transparent">
                        Información Básica
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Datos principales del pedido</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="orderNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-blue-500" />
                            Nº Pedido *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="PO-2024-001"
                              className="bg-white/70 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            />
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
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            Fecha Pedido *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              className="bg-white/70 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Información de Envío */}
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                      <Truck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                        Información de Envío
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Datos logísticos y de transporte</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="shipmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-500" />
                            Tipo de Envío *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/70 border-gray-200 focus:border-blue-500">
                                <SelectValue placeholder="Selecciona tipo de envío" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="marítimo">🚢 Marítimo</SelectItem>
                              <SelectItem value="aéreo">✈️ Aéreo</SelectItem>
                              <SelectItem value="terrestre">🚛 Terrestre</SelectItem>
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
                          <FormLabel className="flex items-center gap-2">
                            <Anchor className="h-4 w-4 text-indigo-500" />
                            Incoterm *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/70 border-gray-200 focus:border-indigo-500">
                                <SelectValue placeholder="Selecciona incoterm" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                              <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                              <SelectItem value="CIF">CIF - Cost Insurance Freight</SelectItem>
                              <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
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
                          <FormLabel className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-purple-500" />
                            Estado *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/70 border-gray-200 focus:border-purple-500">
                                <SelectValue placeholder="Estado del pedido" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(
                                [
                                  "borrador",
                                  "pendiente_pago",
                                  "pagado",
                                  "en_producción",
                                  "listo_embarque",
                                  "embarcado",
                                  "en_tránsito",
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
                  </div>
                </CardContent>
              </Card>

              {/* Datos Adicionales */}
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm">
                      <Navigation className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
                        Datos Adicionales
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Información complementaria (opcional)</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="forwarder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-green-500" />
                            Forwarder
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Nombre del forwarder"
                              className="bg-white/70 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                            />
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
                          <FormLabel className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-orange-500" />
                            Código Tracking
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Código de seguimiento"
                              className="bg-white/70 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                            />
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
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            Llegada Estimada
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              className="bg-white/70 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20"
                            />
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
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-teal-500" />
                            Puerto de Origen
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Puerto de salida"
                              className="bg-white/70 border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="portOfDestination"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-cyan-500" />
                            Puerto de Destino
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Puerto de llegada"
                              className="bg-white/70 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Selección de Productos */}
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-sm">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent">
                        Productos del Pedido
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Selecciona y configura los productos</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Búsqueda de productos */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar productos por nombre, proveedor o tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/70 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  {/* Lista de productos disponibles */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Productos Disponibles</h4>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50/50">
                      {filteredProductLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between p-3 hover:bg-white/70 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors"
                          onClick={() => handleSelectProductLead(lead)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{lead.name}</p>
                              <Badge variant="outline" className="text-xs">{lead.supplierName}</Badge>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                              <span>Precio: ${lead.referencePriceUsd?.toFixed(2) || "N/A"}</span>
                              <span>MOQ: {lead.moq || "N/A"}</span>
                              <span>Estado: {lead.latestStatus || "N/A"}</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectProductLead(lead)
                            }}
                            disabled={fields.some((item) => item.productLeadId === lead.id)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {filteredProductLeads.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No se encontraron productos</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabla de productos seleccionados */}
                  {fields.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Productos Seleccionados</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white/70">
                        <Table>
                          <TableHeader>
                            <tr className="bg-gradient-to-r from-purple-50 to-violet-50">
                              <TableHead className="font-semibold">Producto</TableHead>
                              <TableHead className="font-semibold">Cantidad</TableHead>
                              <TableHead className="font-semibold">Precio USD</TableHead>
                              <TableHead className="font-semibold">Descuento %</TableHead>
                              <TableHead className="font-semibold">Total</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </tr>
                          </TableHeader>
                          <TableBody>
                            {fields.map((item, index) => {
                              const quantity = form.watch(`items.${index}.quantity`) || 0
                              const unitPrice = form.watch(`items.${index}.unitPriceUsd`) || 0
                              const discount = form.watch(`items.${index}.discountPercent`) || 0
                              const total = quantity * unitPrice * (1 - discount / 100)
                              
                              return (
                                <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-gray-900">{item.productLeadName}</p>
                                      <p className="text-xs text-muted-foreground">{item.supplierName}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.quantity`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="1"
                                              {...field}
                                              className="w-20 text-center"
                                              onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.unitPriceUsd`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              min="0"
                                              {...field}
                                              className="w-24"
                                              onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.discountPercent`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="0"
                                              max="100"
                                              {...field}
                                              className="w-20 text-center"
                                              onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-medium text-green-700">
                                      ${total.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => remove(index)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </tr>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {fields.length === 0 && (
                    <div className="text-center py-8 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-muted-foreground font-medium">No hay productos seleccionados</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Busca y selecciona productos de la lista superior
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          {/* Footer con acciones */}
          <DialogFooter className="bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-100 p-6 mt-6 rounded-b-lg">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                {fields.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-gray-700">Total: </span>
                    <span className="text-lg font-bold text-green-700">${totalValue.toFixed(2)} USD</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <DialogClose asChild>
                  <Button 
                    type="button" 
                    variant="outline"
                    disabled={isSubmitting}
                    className="bg-white/70 hover:bg-white border-gray-300"
                  >
                    Cancelar
                  </Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || fields.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditMode ? "Actualizar Pedido" : "Crear Pedido"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </div>
  )
}
