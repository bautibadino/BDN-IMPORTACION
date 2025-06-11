"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import type { Supplier } from "@/lib/types"
import { saveSupplierAction } from "../actions"
import { useToast } from "@/components/ui/use-toast"

const supplierFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  country: z.string().optional(),
  contactName: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal("")),
  source: z.string().optional(),
  language: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional().nullable(),
  isVerified: z.boolean().default(false).optional(),
  firstContact: z.string().optional(), // Considerar un date picker real
  tags: z.string().optional(),
})

type SupplierFormValues = z.infer<typeof supplierFormSchema>

interface SupplierFormProps {
  supplier?: Supplier | null
  onClose: () => void
}

export function SupplierForm({ supplier, onClose }: SupplierFormProps) {
  const { toast } = useToast()
  const isEditMode = !!supplier

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: supplier?.name || "",
      country: supplier?.country || "",
      contactName: supplier?.contactName || "",
      whatsapp: supplier?.whatsapp || "",
      email: supplier?.email || "",
      source: supplier?.source || "",
      language: supplier?.language || "",
      rating: supplier?.rating || undefined,
      isVerified: supplier?.isVerified || false,
      firstContact: supplier?.firstContact ? new Date(supplier.firstContact).toISOString().split("T")[0] : "", // Formato YYYY-MM-DD para input date
      tags: supplier?.tags || "",
    },
  })

  async function onSubmit(data: SupplierFormValues) {
    const result = await saveSupplierAction(supplier?.id || null, data)

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
        <DialogTitle>{isEditMode ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                {" "}
                <FormLabel>Nombre*</FormLabel>{" "}
                <FormControl>
                  <Input {...field} />
                </FormControl>{" "}
                <FormMessage />{" "}
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  {" "}
                  <FormLabel>País</FormLabel>{" "}
                  <FormControl>
                    <Input {...field} />
                  </FormControl>{" "}
                  <FormMessage />{" "}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  {" "}
                  <FormLabel>Nombre Contacto</FormLabel>{" "}
                  <FormControl>
                    <Input {...field} />
                  </FormControl>{" "}
                  <FormMessage />{" "}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  {" "}
                  <FormLabel>WhatsApp</FormLabel>{" "}
                  <FormControl>
                    <Input {...field} />
                  </FormControl>{" "}
                  <FormMessage />{" "}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  {" "}
                  <FormLabel>Email</FormLabel>{" "}
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>{" "}
                  <FormMessage />{" "}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source"
              render={({ field } /* Podría ser un Select */) => (
                <FormItem>
                  {" "}
                  <FormLabel>Fuente</FormLabel>{" "}
                  <FormControl>
                    <Input placeholder="Alibaba, Feria, etc." {...field} />
                  </FormControl>{" "}
                  <FormMessage />{" "}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  {" "}
                  <FormLabel>Idioma</FormLabel>{" "}
                  <FormControl>
                    <Input {...field} />
                  </FormControl>{" "}
                  <FormMessage />{" "}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  {" "}
                  <FormLabel>Rating (1-5)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number.parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin calificar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <SelectItem key={r} value={r.toString()}>
                          {r} estrella{r > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>{" "}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstContact"
              render={({ field }) => (
                <FormItem>
                  {" "}
                  <FormLabel>Primer Contacto</FormLabel>{" "}
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>{" "}
                  <FormMessage />{" "}
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="isVerified"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  {" "}
                  <FormLabel>Verificado</FormLabel>{" "}
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                {" "}
                <FormLabel>Tags</FormLabel>{" "}
                <FormControl>
                  <Input placeholder="tag1, tag2, ..." {...field} />
                </FormControl>{" "}
                <FormDescription>Separados por comas.</FormDescription> <FormMessage />{" "}
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
              {form.formState.isSubmitting ? "Guardando..." : "Guardar Proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
