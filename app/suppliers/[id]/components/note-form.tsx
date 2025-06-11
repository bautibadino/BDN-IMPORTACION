"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import type { SupplierNoteFormData } from "@/lib/types"
import { addSupplierNoteAction } from "../../actions" // Ajustar ruta si es necesario
import { useToast } from "@/components/ui/use-toast"

const noteSchema = z.object({
  note: z.string().min(1, "La nota no puede estar vacía."),
  // addedBy: z.string().optional(), // Podrías obtener esto del usuario autenticado
})
type NoteFormValues = Pick<SupplierNoteFormData, "note"> // Solo necesitamos la nota del form

interface NoteFormProps {
  supplierId: string
  onClose: () => void
}

export function NoteForm({ supplierId, onClose }: NoteFormProps) {
  const { toast } = useToast()
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: "" },
  })

  async function onSubmit(data: NoteFormValues) {
    const formData: SupplierNoteFormData = {
      supplierId,
      note: data.note,
      date: new Date().toISOString(), // La action lo setea, pero podemos ponerlo aquí también
      // addedBy: "Usuario Actual" // Implementar cuando haya auth
    }
    const result = await addSupplierNoteAction(formData)
    if (result.success) {
      toast({ title: "Nota añadida" })
      onClose()
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Añadir Nota al Proveedor</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                {" "}
                <FormLabel>Nota</FormLabel>{" "}
                <FormControl>
                  <Textarea {...field} rows={4} />
                </FormControl>{" "}
                <FormMessage />{" "}
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
              Guardar Nota
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
