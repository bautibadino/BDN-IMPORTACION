import { use } from "react"
import { getSupplierById, getSupplierNotes } from "@/lib/store"
import { PageHeader } from "@/app/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  MessageSquare, 
  Globe, 
  Star, 
  CheckCircle, 
  Tag, 
  CalendarDays, 
  Languages, 
  Users, 
  ArrowLeft,
  Phone,
  Award,
  Sparkles,
  Building,
  Clock
} from "lucide-react"
import Link from "next/link"
import { SupplierNotesSection } from "./components/supplier-notes-section"

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Usar React.use() para unwrap la Promise de params
  const { id } = use(params)
  
  const supplier = await getSupplierById(id)
  const notes = await getSupplierNotes(id)

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
          <CardContent className="text-center py-12">
            <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Building className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Proveedor no encontrado</h2>
            <p className="text-muted-foreground mb-6">
              El proveedor que buscas no existe o ha sido eliminado.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/suppliers">
                <ArrowLeft className="h-4 w-4" />
                Volver a Proveedores
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
            <PageHeader title={supplier.name}>
              <div className="flex items-center gap-3">
                {supplier.isVerified && (
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <div className="relative">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <span className="text-xs font-medium text-emerald-700">Verificado</span>
                  </div>
                )}
                {supplier.rating && (
                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-medium text-amber-700">{supplier.rating}/5</span>
                  </div>
                )}
                <Button asChild variant="outline" className="gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <Link href="/suppliers">
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
            {/* Columna principal - Información del proveedor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card de información general */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Información General
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {supplier.contactName && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Contacto</p>
                        <p className="font-medium text-gray-900">{supplier.contactName}</p>
                      </div>
                    </div>
                  )}
                  
                  {supplier.country && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Globe className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">País</p>
                        <p className="font-medium text-gray-900">{supplier.country}</p>
                      </div>
                    </div>
                  )}
                  
                  {supplier.email && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Mail className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a 
                          href={`mailto:${supplier.email}`} 
                          className="font-medium text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                        >
                          {supplier.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {supplier.whatsapp && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">WhatsApp</p>
                        <p className="font-medium text-gray-900">{supplier.whatsapp}</p>
                      </div>
                    </div>
                  )}
                  
                  {supplier.source && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Award className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fuente</p>
                        <p className="font-medium text-gray-900">{supplier.source}</p>
                      </div>
                    </div>
                  )}
                  
                  {supplier.language && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Languages className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Idioma</p>
                        <p className="font-medium text-gray-900">{supplier.language}</p>
                      </div>
                    </div>
                  )}
                  
                  {supplier.firstContact && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Clock className="h-4 w-4 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Primer Contacto</p>
                        <p className="font-medium text-gray-900">
                          {new Date(supplier.firstContact).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card de tags */}
              {supplier.tags && (
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
                      {supplier.tags.split(",").map((tag, index) => (
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

            {/* Columna lateral - Notas */}
            <div className="space-y-6">
              <SupplierNotesSection supplierId={supplier.id} initialNotes={notes} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
