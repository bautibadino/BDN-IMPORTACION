"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Package, 
  Sparkles, 
  Save, 
  X,
  DollarSign,
  TrendingUp,
  Hash,
  FileText,
  BarChart3,
  ExternalLink,
  Target,
  Loader2
} from "lucide-react"
import type { Product, ProductFormData, ProductLead } from "@/lib/types"
import { createOrUpdateProductFromLeadAction, updateProductAction } from "../actions"
import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react"

const productFormSchema = z.object({
  productLeadId: z.string().optional(), // Será validado manualmente en onSubmit
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  finalUnitCostUsd: z.coerce.number().positive({ message: "El costo debe ser positivo." }),
  markupPercentage: z.coerce.number().min(0, { message: "El margen no puede ser negativo." }),
  stock: z.coerce.number().int().min(0, { message: "El stock no puede ser negativo." }),
  mlListingUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal("")),
})

type ProductFormValues = z.infer<typeof productFormSchema>

interface ProductFormProps {
  product?: Product | null
  productLead?: ProductLead | null
  defaultValues?: Partial<ProductFormValues & { productLeadId?: string; productLeadName?: string }>
  allProductLeads?: ProductLead[]
  onClose: () => void
}

export function ProductForm({ product, productLead, defaultValues, allProductLeads = [], onClose }: ProductFormProps) {
  const { toast } = useToast()
  const isEditMode = !!product

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productLeadId: product?.productLeadId || productLead?.id || defaultValues?.productLeadId || undefined,
      name: product?.name || productLead?.name || defaultValues?.name || "",
      finalUnitCostUsd: product?.finalUnitCostUsd || defaultValues?.finalUnitCostUsd || 0,
      markupPercentage: product?.markupPercentage || defaultValues?.markupPercentage || 0,
      stock: product?.stock || defaultValues?.stock || 0,
      mlListingUrl: product?.mlListingUrl || defaultValues?.mlListingUrl || "",
    },
  })

  const selectedLeadId = form.watch("productLeadId")

  useEffect(() => {
    if (!isEditMode && selectedLeadId) {
      const selectedLead = allProductLeads.find((lead) => lead.id === selectedLeadId)
      if (selectedLead) {
        form.setValue("name", selectedLead.name, { shouldValidate: true })
        if (selectedLead.referencePriceUsd) {
          form.setValue("finalUnitCostUsd", selectedLead.referencePriceUsd, { shouldValidate: true })
        }
      }
    }
  }, [selectedLeadId, isEditMode, allProductLeads, form])

  async function onSubmit(data: ProductFormValues) {
    if (!isEditMode && !data.productLeadId) {
      form.setError("productLeadId", { type: "manual", message: "Debe seleccionar un lead de producto." })
      return
    }

    const formData: ProductFormData = data
    let result

    try {
      if (isEditMode && product) {
        result = await updateProductAction(product.id, formData)
      } else if (data.productLeadId) {
        // Esta acción crea un producto si no existe para el lead, o actualiza el stock si ya existe.
        // Para este formulario, siempre creará uno nuevo si el lead no ha sido convertido a producto.
        result = await createOrUpdateProductFromLeadAction({ ...formData, productLeadId: data.productLeadId })
      } else {
        toast({ 
          title: "Error", 
          description: "Falta Product Lead ID para crear el producto.", 
          variant: "destructive",
          className: "bg-red-50 border-red-200 text-red-800"
        })
        return
      }

      if (result.success) {
        toast({ 
          title: "¡Éxito!", 
          description: result.message,
          className: "bg-green-50 border-green-200 text-green-800"
        })
        onClose()
      } else {
        toast({ 
          title: "Error", 
          description: result.message, 
          variant: "destructive",
          className: "bg-red-50 border-red-200 text-red-800"
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Ocurrió un error inesperado. Inténtalo de nuevo.", 
        variant: "destructive",
        className: "bg-red-50 border-red-200 text-red-800"
      })
    }
  }

  return (
    <div className="space-y-6">
      <DialogHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-xl bg-gradient-to-r from-purple-800 to-indigo-800 bg-clip-text text-transparent">
              {isEditMode ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditMode
                ? "Modifica los datos del producto existente."
                : "Selecciona un lead y completa los datos para crear un nuevo producto."}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Sección: Información Básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-900">Información Básica</h3>
            </div>
            
            {!isEditMode && (
              <FormField
                control={form.control}
                name="productLeadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      Basado en Lead de Producto*
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-purple-200 focus:border-purple-400 focus:ring-purple-400">
                          <SelectValue placeholder="Seleccione un lead..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allProductLeads.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            No hay leads disponibles
                          </div>
                        ) : (
                          allProductLeads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              <div className="flex items-center gap-2">
                                <Package className="h-3 w-3 text-purple-500" />
                                {lead.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-600" />
                    Nombre del Producto*
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Smartwatch X1 Premium" 
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* Sección: Información Comercial */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <div className="p-1.5 bg-green-100 rounded-md">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-900">Información Comercial</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="finalUnitCostUsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Costo Unitario (USD)*
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ej: 30.50" 
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="markupPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      Margen (%)*
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="Ej: 50" 
                        className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    Stock Inicial*
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ej: 100" 
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* Sección: Enlaces Externos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <div className="p-1.5 bg-yellow-100 rounded-md">
                <ExternalLink className="h-4 w-4 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-yellow-900">Enlaces Externos</h3>
            </div>

            <FormField
              control={form.control}
              name="mlListingUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-yellow-600" />
                    URL Publicación MercadoLibre (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://articulo.mercadolibre.com.ar/..." 
                      className="border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter className="gap-2 pt-6">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline" 
                className="gap-2 hover:bg-gray-50"
                disabled={form.formState.isSubmitting}
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting}
              className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditMode ? "Guardando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditMode ? "Guardar Cambios" : "Crear Producto"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  )
}
