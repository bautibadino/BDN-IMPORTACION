"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { 
  Package, 
  Users, 
  DollarSign, 
  Layers, 
  Coins, 
  Box, 
  Weight, 
  Camera, 
  Link, 
  Tag,
  Save,
  Sparkles
} from "lucide-react"
import type { ProductLead, Supplier } from "@/lib/types"
import { saveProductLeadAction } from "../actions"
import { useToast } from "@/components/ui/use-toast"

const leadFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  category: z.string().optional(),
  supplierId: z.string({ required_error: "Debes seleccionar un proveedor." }),
  referencePriceUsd: z.coerce.number().positive("El precio debe ser positivo.").optional().nullable(),
  moq: z.coerce.number().int().positive("MOQ debe ser positivo.").optional().nullable(),
  currency: z.string().optional(),
  volumeM3: z.coerce.number().positive("Volumen debe ser positivo.").optional().nullable(),
  weightKg: z.coerce.number().positive("Peso debe ser positivo.").optional().nullable(),
  photoUrl: z.string().url("URL de foto inválida.").optional().or(z.literal("")),
  sourceUrl: z.string().url("URL de fuente inválida.").optional().or(z.literal("")),
  tags: z.string().optional(),
})

type LeadFormValues = z.infer<typeof leadFormSchema>

interface LeadFormProps {
  lead?: ProductLead | null
  suppliers: Supplier[]
  onClose: () => void
}

export function LeadForm({ lead, suppliers, onClose }: LeadFormProps) {
  const { toast } = useToast()
  const isEditMode = !!lead

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name || "",
      category: lead?.category || "",
      supplierId: lead?.supplierId || undefined,
      referencePriceUsd: lead?.referencePriceUsd ?? null,
      moq: lead?.moq ?? null,
      currency: lead?.currency || "USD",
      volumeM3: lead?.volumeM3 ?? null,
      weightKg: lead?.weightKg ?? null,
      photoUrl: lead?.photoUrl || "",
      sourceUrl: lead?.sourceUrl || "",
      tags: lead?.tags || "",
    },
  })

  async function onSubmit(data: LeadFormValues) {
    const result = await saveProductLeadAction(lead?.id || null, data)
    if (result.success) {
      toast({ 
        title: "¡Lead guardado!", 
        description: result.message,
      })
      onClose()
    } else {
      toast({ 
        title: "Error", 
        description: result.message, 
        variant: "destructive" 
      })
    }
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/30">
      <DialogHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {isEditMode ? "Editar Lead" : "Nuevo Lead"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditMode ? "Actualiza la información del lead" : "Agrega un nuevo lead de producto"}
            </p>
          </div>
        </div>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Información Básica
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-gray-700">
                    <Package className="h-4 w-4 text-blue-500" />
                    Nombre del Producto *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ej: Camiseta algodón orgánico"
                      className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4 text-green-500" />
                    Proveedor *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-gray-700">
                    <Layers className="h-4 w-4 text-purple-500" />
                    Categoría
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ej: Textiles, Electrónicos"
                      className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Información comercial */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Información Comercial
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="referencePriceUsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Precio Ref. (USD)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        value={field.value ?? ""} 
                        placeholder="0.00"
                        className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      Moneda
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="USD, CNY, EUR" 
                        {...field}
                        className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="moq"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700">
                      <Layers className="h-4 w-4 text-blue-500" />
                      MOQ (Cantidad Mínima)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value ?? ""} 
                        placeholder="100"
                        className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Especificaciones físicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
              <Box className="h-4 w-4 text-orange-500" />
              Especificaciones Físicas
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="volumeM3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700">
                      <Box className="h-4 w-4 text-orange-500" />
                      Volumen (m³)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001" 
                        {...field} 
                        value={field.value ?? ""} 
                        placeholder="0.150"
                        className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700">
                      <Weight className="h-4 w-4 text-red-500" />
                      Peso (kg)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        value={field.value ?? ""} 
                        placeholder="0.25"
                        className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Enlaces y multimedia */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
              <Camera className="h-4 w-4 text-pink-500" />
              Enlaces y Multimedia
            </div>
            
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-gray-700">
                    <Camera className="h-4 w-4 text-pink-500" />
                    URL de Foto
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://ejemplo.com/foto.jpg" 
                      {...field}
                      className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sourceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-gray-700">
                    <Link className="h-4 w-4 text-indigo-500" />
                    URL Fuente (Alibaba, etc.)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://alibaba.com/product/..." 
                      {...field}
                      className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-gray-700">
                    <Tag className="h-4 w-4 text-purple-500" />
                    Etiquetas
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="algodón, eco-friendly, premium" 
                      {...field}
                      className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Separadas por comas para mejor organización
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <DialogFooter className="gap-3 pt-4 border-t border-gray-100">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline"
                className="border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300 gap-2"
            >
              {form.formState.isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditMode ? "Guardar Cambios" : "Crear Lead"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  )
}
