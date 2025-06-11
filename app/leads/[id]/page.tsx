import { getProductLeadById, getSupplierById } from "@/lib/store"
import { PageHeader } from "@/app/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
// Importar iconos necesarios
import { DollarSign, Package, Layers, Tag, CalendarCheck, LinkIcon, Weight, Box, Users } from "lucide-react"
// Crear componente para LeadStatusesSection similar a SupplierNotesSection
// import { LeadStatusesSection } from "./components/lead-statuses-section";

export default async function ProductLeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await getProductLeadById(params.id)
  // const statuses = await getProductLeadStatuses(params.id) // Descomentar cuando se implemente
  const supplier = lead ? await getSupplierById(lead.supplierId) : null

  if (!lead) {
    return (
      <PageHeader title="Lead no encontrado">
        <Button asChild variant="outline">
          <Link href="/leads">Volver a Leads</Link>
        </Button>
      </PageHeader>
    )
  }

  return (
    <>
      <PageHeader title={lead.name}>
        <Button asChild variant="outline">
          <Link href="/leads">Volver</Link>
        </Button>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.photoUrl && (
                <img
                  src={lead.photoUrl || "/placeholder.svg"}
                  alt={lead.name}
                  className="w-32 h-32 object-cover rounded-md border mb-3"
                />
              )}
              <p className="flex items-center">
                <Package className="mr-2 h-4 w-4 text-muted-foreground" /> Categoría: {lead.category || "N/A"}
              </p>
              {supplier && (
                <p className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" /> Proveedor:{" "}
                  <Link href={`/suppliers/${supplier.id}`} className="text-primary hover:underline">
                    {supplier.name}
                  </Link>
                </p>
              )}
              {lead.referencePriceUsd && (
                <p className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> Precio Ref.: $
                  {lead.referencePriceUsd.toFixed(2)} {lead.currency}
                </p>
              )}
              {lead.moq && (
                <p className="flex items-center">
                  <Layers className="mr-2 h-4 w-4 text-muted-foreground" /> MOQ: {lead.moq} unidades
                </p>
              )}
              {lead.volumeM3 && (
                <p className="flex items-center">
                  <Box className="mr-2 h-4 w-4 text-muted-foreground" /> Volumen: {lead.volumeM3} m³
                </p>
              )}
              {lead.weightKg && (
                <p className="flex items-center">
                  <Weight className="mr-2 h-4 w-4 text-muted-foreground" /> Peso: {lead.weightKg} kg
                </p>
              )}
              {lead.sourceUrl && (
                <p className="flex items-center">
                  <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Fuente:{" "}
                  <a
                    href={lead.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Ver producto
                  </a>
                </p>
              )}
              {lead.tags && (
                <p className="flex items-start">
                  <Tag className="mr-2 h-4 w-4 text-muted-foreground mt-1" /> Tags: {lead.tags}
                </p>
              )}
              <p className="flex items-center">
                <CalendarCheck className="mr-2 h-4 w-4 text-muted-foreground" /> Creado:{" "}
                {new Date(lead.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          {/* <LeadStatusesSection productLeadId={lead.id} initialStatuses={statuses} /> */}
          <Card>
            <CardHeader>
              <CardTitle>Estados del Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Próximamente...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
