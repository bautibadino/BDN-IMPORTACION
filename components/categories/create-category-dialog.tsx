"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Tag, Palette } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const createCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(50, "Máximo 50 caracteres"),
  type: z.enum(["marca", "tipo", "rubro", "material", "color", "tamaño", "otros"], {
    required_error: "Selecciona un tipo de categoría"
  }),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})

type CreateCategoryFormData = z.infer<typeof createCategorySchema>

interface CreateCategoryDialogProps {
  onCategoryCreated?: (category: any) => void
  trigger?: React.ReactNode
}

export function CreateCategoryDialog({ onCategoryCreated, trigger }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      type: "otros",
      description: "",
      color: "",
      icon: "",
    },
  })

  const onSubmit = async (data: CreateCategoryFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-category',
          ...data,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message,
          className: "bg-green-50 border-green-200 text-green-800"
        })
        
        form.reset()
        setOpen(false)
        
        if (onCategoryCreated) {
          onCategoryCreated(result.category)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al crear la categoría",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast({
        title: "Error",
        description: "Error de conexión al crear la categoría",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeOptions = [
    { value: "marca", label: "Marca", icon: "🏷️", description: "Marcas de productos" },
    { value: "tipo", label: "Tipo", icon: "📱", description: "Tipos de productos" },
    { value: "rubro", label: "Rubro", icon: "📦", description: "Categorías generales" },
    { value: "material", label: "Material", icon: "🔧", description: "Materiales de fabricación" },
    { value: "color", label: "Color", icon: "🎨", description: "Colores disponibles" },
    { value: "tamaño", label: "Tamaño", icon: "📏", description: "Tamaños y dimensiones" },
    { value: "otros", label: "Otros", icon: "⚙️", description: "Otras características" },
  ]

  const colorOptions = [
    { value: "#3B82F6", label: "Azul", color: "#3B82F6" },
    { value: "#10B981", label: "Verde", color: "#10B981" },
    { value: "#8B5CF6", label: "Violeta", color: "#8B5CF6" },
    { value: "#F59E0B", label: "Amarillo", color: "#F59E0B" },
    { value: "#EF4444", label: "Rojo", color: "#EF4444" },
    { value: "#6B7280", label: "Gris", color: "#6B7280" },
    { value: "#6366F1", label: "Índigo", color: "#6366F1" },
    { value: "#EC4899", label: "Rosa", color: "#EC4899" },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Categoría
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Crear Nueva Categoría
          </DialogTitle>
          <DialogDescription>
            Crea una nueva categoría para organizar mejor tus productos
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la categoría</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Samsung, Smartphones, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span>{option.icon}</span>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </div>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción de la categoría..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: option.color }}
                            />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    El color se usará para mostrar la categoría en la interfaz
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Categoría
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 