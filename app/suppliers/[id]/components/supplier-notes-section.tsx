"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"
import type { SupplierNote } from "@/lib/types"
import { NoteForm } from "./note-form" // Asegúrate que la ruta es correcta

interface SupplierNotesSectionProps {
  supplierId: string
  initialNotes: SupplierNote[]
}

export function SupplierNotesSection({ supplierId, initialNotes }: SupplierNotesSectionProps) {
  const [notes, setNotes] = useState<SupplierNote[]>(initialNotes)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)

  // Esta función se pasaría al NoteForm para actualizar el estado localmente
  // o podríamos depender de la revalidación de Next.js si la página es Server Component
  // y el NoteForm causa una revalidación. Por ahora, el NoteForm usa una Server Action
  // que revalida, así que la página de detalle se actualizará.
  // Para una UI más reactiva sin recarga completa, se podría actualizar el estado aquí.

  const handleCloseNoteDialog = () => {
    setIsNoteDialogOpen(false)
    // Aquí podríamos forzar una recarga de notas si no confiamos en la revalidación automática
    // o si la página de detalle no se recarga completamente.
    // Por ahora, la Server Action en NoteForm revalida la ruta /suppliers/[id]
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notas</CardTitle>
          <CardDescription>Historial de comunicaciones y notas.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsNoteDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nota
        </Button>
      </CardHeader>
      <CardContent>
        {notes.length === 0 && <p className="text-sm text-muted-foreground">No hay notas para este proveedor.</p>}
        <ul className="space-y-3">
          {notes
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((note) => (
              <li key={note.id} className="text-sm border-b pb-2">
                <p className="font-medium">{note.note}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(note.date).toLocaleDateString()} {note.addedBy && `- ${note.addedBy}`}
                </p>
              </li>
            ))}
        </ul>
      </CardContent>
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <NoteForm supplierId={supplierId} onClose={handleCloseNoteDialog} />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
