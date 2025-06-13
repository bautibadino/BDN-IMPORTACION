"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  PlusCircle, 
  MessageSquare, 
  Calendar, 
  User, 
  Clock,
  FileText,
  Sparkles
} from "lucide-react"
import type { SupplierNote } from "@/lib/types"
import { NoteForm } from "./note-form"
import { getSupplierNotes } from "@/lib/store"

interface SupplierNotesSectionProps {
  supplierId: string
  initialNotes: SupplierNote[]
}

export function SupplierNotesSection({ supplierId, initialNotes }: SupplierNotesSectionProps) {
  const [notes, setNotes] = useState<SupplierNote[]>(initialNotes)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)

  const handleCloseNoteDialog = async () => {
    setIsNoteDialogOpen(false)
    // Refrescar las notas cuando se cierre el diálogo
    const updatedNotes = await getSupplierNotes(supplierId)
    setNotes(updatedNotes)
  }

  // Actualizar las notas si cambian las props iniciales
  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  // Agrupar notas por fecha (últimos 7 días, este mes, más antiguas)
  const categorizeNotes = (notes: SupplierNote[]) => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recent = notes.filter(note => new Date(note.date) >= sevenDaysAgo)
    const thisMonth = notes.filter(note => 
      new Date(note.date) < sevenDaysAgo && new Date(note.date) >= thirtyDaysAgo
    )
    const older = notes.filter(note => new Date(note.date) < thirtyDaysAgo)

    return { recent, thisMonth, older }
  }

  const sortedNotes = notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const { recent, thisMonth, older } = categorizeNotes(sortedNotes)

  const formatRelativeTime = (date: string | Date) => {
    const now = new Date()
    const noteDate = new Date(date)
    const diffInHours = Math.floor((now.getTime() - noteDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Hace menos de 1 hora"
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
    
    return noteDate.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const NoteItem = ({ note, isRecent = false }: { note: SupplierNote, isRecent?: boolean }) => (
    <div className={`group relative p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
      isRecent 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100' 
        : 'bg-gradient-to-br from-gray-50 to-white border border-gray-100'
    }`}>
      {isRecent && (
        <div className="absolute -top-1 -right-1">
          <div className="relative">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
          </div>
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          isRecent ? 'bg-blue-100' : 'bg-gray-100'
        } group-hover:scale-105 transition-transform`}>
          <FileText className={`h-4 w-4 ${
            isRecent ? 'text-blue-600' : 'text-gray-600'
          }`} />
        </div>
        
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium leading-relaxed text-gray-900">
            {note.note}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(note.date)}</span>
            </div>
            
            {note.addedBy && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{note.addedBy}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const NotesSection = ({ title, notes: sectionNotes, icon }: { 
    title: string, 
    notes: SupplierNote[], 
    icon: React.ReactNode 
  }) => (
    sectionNotes.length > 0 && (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
          <Badge variant="secondary" className="text-xs">
            {sectionNotes.length}
          </Badge>
        </div>
        <div className="space-y-3">
          {sectionNotes.map((note) => (
            <NoteItem 
              key={note.id} 
              note={note} 
              isRecent={title === "Recientes"}
            />
          ))}
        </div>
      </div>
    )
  )

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Notas
              {notes.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {notes.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Historial de comunicaciones y seguimiento
            </CardDescription>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => setIsNoteDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> 
            Nueva Nota
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No hay notas aún
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comienza agregando la primera nota para este proveedor
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsNoteDialogOpen(true)}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Agregar primera nota
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              <NotesSection 
                title="Recientes" 
                notes={recent} 
                icon={<Sparkles className="h-4 w-4 text-blue-500" />}
              />
              
              <NotesSection 
                title="Este mes" 
                notes={thisMonth} 
                icon={<Calendar className="h-4 w-4 text-green-500" />}
              />
              
              <NotesSection 
                title="Anteriores" 
                notes={older} 
                icon={<Clock className="h-4 w-4 text-gray-500" />}
              />
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <NoteForm supplierId={supplierId} onClose={handleCloseNoteDialog} />
        </DialogContent>
      </Dialog>
    </Card>
  )
}