"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
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
      supplierId: lead?.supplierId || undefined, // undefined está bien para Select con placeholder
      referencePriceUsd: lead?.referencePriceUsd ?? null, // Cambiado a null
      moq: lead?.moq ?? null, // Cambiado a null
      currency: lead?.currency || "USD",
      volumeM3: lead?.volumeM3 ?? null, // Cambiado a null
      weightKg: lead?.weightKg ?? null, // Cambiado a null
      photoUrl: lead?.photoUrl || "",
      sourceUrl: lead?.sourceUrl || "",
      tags: lead?.tags || "",
    },
  })

  async function onSubmit(data: LeadFormValues) {
    // Filtrar valores null antes de enviar si la action no los espera o la DB no los permite
    // En este caso, el schema los permite como nullable, así que está bien pasarlos.
    const result = await saveProductLeadAction(lead?.id || null, data)
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
        <DialogTitle>{isEditMode ? "Editar Lead" : "Nuevo Lead"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre*</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Proveedor*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referencePriceUsd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Ref. (USD)</FormLabel>
                  <FormControl>
                    {/* El input type="number" manejará el valor null como vacío */}
                    <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
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
                  <FormLabel>MOQ</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value ?? ""} />
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
                  <FormLabel>Moneda</FormLabel>
                  <FormControl>
                    <Input placeholder="USD, CNY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="volumeM3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volumen (m³)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.001" {...field} value={field.value ?? ""} />
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
                  <FormLabel>Peso (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="photoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Foto</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://..." {...field} />
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
                <FormLabel>URL Fuente (Alibaba, etc.)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://..." {...field} />
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
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input placeholder="tag1, tag2" {...field} />
                </FormControl>
                <FormDescription>Separados por comas.</FormDescription> <FormMessage />
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
              {form.formState.isSubmitting ? "Guardando..." : isEditMode ? "Guardar Cambios" : "Crear Lead"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
