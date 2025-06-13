import { use } from "react"
import { getProductLeadById, getSupplierById } from "@/lib/store"
import { PageHeader } from "@/app/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  DollarSign, 
  Package, 
  Layers, 
  Tag, 
  CalendarCheck, 
  LinkIcon, 
  Weight, 
  Box, 
  Users, 
  ArrowLeft, 
  Camera,
  Building2,
  Globe,
  Sparkles,
  Clock,
  ExternalLink
} from "lucide-react"
// Crear componente para LeadStatusesSection similar a SupplierNotesSection
// import { LeadStatusesSection } from "./components/lead-statuses-section";

export default async function ProductLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Usar React.use() para unwrap la Promise de params
  const { id } = use(params)
  
  const lead = await getProductLeadById(id)
  // const statuses = await getProductLeadStatuses(id) // Descomentar cuando se implemente
  const supplier = lead ? await getSupplierById(lead.supplierId) : null

  if (!lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
          <CardContent className="text-center py-12">
            <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Package className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lead no encontrado</h2>
            <p className="text-muted-foreground mb-6">
              El lead que buscas no existe o ha sido eliminado.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/leads">
                <ArrowLeft className="h-4 w-4" />
                Volver a Leads
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="space-y-6">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-white to-gray-50/50 border-b border-gray-100">
          <div className="container mx-auto">
            <PageHeader title={lead.name}>
              <div className="flex items-center gap-3">
                {lead.category && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-purple-200">
                    <Layers className="h-3 w-3 mr-1" />
                    {lead.category}
                  </Badge>
                )}
                {lead.referencePriceUsd && (
                  <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-green-700">${lead.referencePriceUsd.toFixed(2)}</span>
                  </div>
                )}
                <Button asChild variant="outline" className="gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <Link href="/leads">
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </Link>
                </Button>
              </div>
            </PageHeader>
          </div>
        </div>

        <div className="container mx-auto">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Columna principal - Información del lead */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card de información general */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Detalles del Producto
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Imagen del producto */}
                  {lead.photoUrl && (
                    <div className="flex justify-center mb-6">
                      <div className="relative group">
                        <img
                          src={lead.photoUrl}
                          alt={lead.name}
                          className="w-48 h-48 object-cover rounded-xl border-4 border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                  )}

                  {/* Información del proveedor */}
                  {supplier && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Building2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Proveedor</p>
                        <Link 
                          href={`/suppliers/${supplier.id}`} 
                          className="font-medium text-green-600 hover:text-green-700 hover:underline transition-colors"
                        >
                          {supplier.name}
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Información comercial */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lead.referencePriceUsd && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Precio Referencia</p>
                          <p className="font-medium text-gray-900">
                            ${lead.referencePriceUsd.toFixed(2)} {lead.currency || 'USD'}
                          </p>
                        </div>
                      </div>
                    )}

                    {lead.moq && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Layers className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">MOQ (Cantidad Mínima)</p>
                          <p className="font-medium text-gray-900">{lead.moq} unidades</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Especificaciones físicas */}
                  {(lead.volumeM3 || lead.weightKg) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lead.volumeM3 && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Box className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Volumen</p>
                            <p className="font-medium text-gray-900">{lead.volumeM3} m³</p>
                          </div>
                        </div>
                      )}

                      {lead.weightKg && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <Weight className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Peso</p>
                            <p className="font-medium text-gray-900">{lead.weightKg} kg</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enlaces */}
                  {lead.sourceUrl && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Globe className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fuente del Producto</p>
                        <a
                          href={lead.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors flex items-center gap-1"
                        >
                          Ver producto original
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Fecha de creación */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Clock className="h-4 w-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de Creación</p>
                      <p className="font-medium text-gray-900">
                        {new Date(lead.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de tags */}
              {lead.tags && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                        <Tag className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Etiquetas
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.split(",").map((tag, index) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-colors px-3 py-1"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Columna lateral - Estados del lead */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                      <CalendarCheck className="h-5 w-5 text-amber-600" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Estados del Lead
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="p-4 bg-amber-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CalendarCheck className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      Próximamente
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Función de seguimiento de estados en desarrollo
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
