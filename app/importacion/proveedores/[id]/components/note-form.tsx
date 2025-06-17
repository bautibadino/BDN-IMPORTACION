"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { FileText, Sparkles, Save } from "lucide-react"
import type { SupplierNoteFormData } from "@/lib/types"
import { addSupplierNoteAction } from "../../actions"
import { useToast } from "@/components/ui/use-toast"

const noteSchema = z.object({
  note: z.string().min(1, "La nota no puede estar vacía."),
})
type NoteFormValues = Pick<SupplierNoteFormData, "note">

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
      // addedBy: "Usuario Actual" // Implementar cuando haya auth
    }
    const result = await addSupplierNoteAction(formData)
    if (result.success) {
      toast({ 
        title: "¡Nota añadida!", 
        description: "La nota se ha guardado exitosamente.",
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
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Nueva Nota
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega información importante sobre este proveedor
            </p>
          </div>
        </div>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Contenido de la nota
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Textarea 
                      {...field} 
                      rows={5}
                      placeholder="Escribe aquí los detalles importantes sobre este proveedor..."
                      className="border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
                  Guardar Nota
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  )
}
