"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
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

    if (isEditMode && product) {
      result = await updateProductAction(product.id, formData)
    } else if (data.productLeadId) {
      // Esta acción crea un producto si no existe para el lead, o actualiza el stock si ya existe.
      // Para este formulario, siempre creará uno nuevo si el lead no ha sido convertido a producto.
      result = await createOrUpdateProductFromLeadAction({ ...formData, productLeadId: data.productLeadId })
    } else {
      toast({ title: "Error", description: "Falta Product Lead ID para crear el producto.", variant: "destructive" })
      return
    }

    if (result.success) {
      toast({ title: "Éxito", description: result.message })
      onClose()
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Modifica los datos del producto."
            : "Selecciona un lead y completa los datos para crear un nuevo producto."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {!isEditMode && (
            <FormField
              control={form.control}
              name="productLeadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Basado en Lead de Producto*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un lead..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allProductLeads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name}
                        </SelectItem>
                      ))}
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
                <FormLabel>Nombre del Producto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Smartwatch X1 Premium" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="finalUnitCostUsd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo Unitario Final (USD)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ej: 30.50" {...field} />
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
                <FormLabel>Margen (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="Ej: 50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Inicial</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mlListingUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Publicación MercadoLibre (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
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
              {form.formState.isSubmitting
                ? isEditMode
                  ? "Guardando..."
                  : "Creando..."
                : isEditMode
                  ? "Guardar Cambios"
                  : "Crear Producto"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
