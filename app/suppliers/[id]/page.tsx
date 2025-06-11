import { getSupplierById, getSupplierNotes } from "@/lib/store"
import { PageHeader } from "@/app/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare, Globe, Star, CheckCircle, Tag, CalendarDays, Languages, Users } from "lucide-react"
import Link from "next/link"
import { SupplierNotesSection } from "./components/supplier-notes-section" // Crearemos este componente

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const supplier = await getSupplierById(params.id)
  const notes = await getSupplierNotes(params.id)

  if (!supplier) {
    return (
      <PageHeader title="Proveedor no encontrado">
        <Button asChild variant="outline">
          <Link href="/suppliers">Volver a Proveedores</Link>
        </Button>
      </PageHeader>
    )
  }

  return (
    <>
      <PageHeader title={supplier.name}>
        <Button asChild variant="outline">
          <Link href={`/suppliers`}>Volver</Link>
        </Button>
        {/* Aquí podrías añadir un botón para editar que abra el mismo SupplierForm en un Dialog */}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.contactName && (
                <p className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" /> Contacto: {supplier.contactName}
                </p>
              )}
              {supplier.country && (
                <p className="flex items-center">
                  <Globe className="mr-2 h-4 w-4 text-muted-foreground" /> País: {supplier.country}
                </p>
              )}
              {supplier.email && (
                <p className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email:{" "}
                  <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                    {supplier.email}
                  </a>
                </p>
              )}
              {supplier.whatsapp && (
                <p className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" /> WhatsApp: {supplier.whatsapp}
                </p>
              )}
              {supplier.source && (
                <p className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" /> Fuente: {supplier.source}
                </p>
              )}
              {supplier.language && (
                <p className="flex items-center">
                  <Languages className="mr-2 h-4 w-4 text-muted-foreground" /> Idioma: {supplier.language}
                </p>
              )}
              {supplier.firstContact && (
                <p className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> Primer Contacto:{" "}
                  {new Date(supplier.firstContact).toLocaleDateString()}
                </p>
              )}
              {supplier.rating && (
                <p className="flex items-center">
                  <Star className="mr-2 h-4 w-4 text-yellow-400 fill-yellow-400" /> Rating: {supplier.rating}/5
                </p>
              )}
              {supplier.isVerified && (
                <p className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Verificado
                </p>
              )}
              {supplier.tags && (
                <p className="flex items-start">
                  <Tag className="mr-2 h-4 w-4 text-muted-foreground mt-1" /> Tags: {supplier.tags}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <SupplierNotesSection supplierId={supplier.id} initialNotes={notes} />
        </div>
      </div>
    </>
  )
}
