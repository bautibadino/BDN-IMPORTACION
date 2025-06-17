"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  MoreHorizontal, 
  PlusCircle, 
  Star, 
  CheckCircle, 
  Search, 
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  MapPin,
  Users,
  Eye,
  Edit,
  Trash2,
  Award,
  Globe,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SupplierForm } from "./components/supplier-form"
import type { Supplier } from "@/lib/types"
import { deleteSupplierAction, getSuppliersAction } from "./actions"
import { useToast } from "@/components/ui/use-toast"
import { PageHeader } from "@/app/components/page-header"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const { toast } = useToast()
  const [dataVersion, setDataVersion] = useState(0)
  const refreshData = () => setDataVersion((v) => v + 1)

  useEffect(() => {
    async function loadSuppliers() {
      const data = await getSuppliersAction()
      setSuppliers(data)
      setFilteredSuppliers(data)
    }
    loadSuppliers()
  }, [dataVersion])

  // Filtros y búsqueda
  useEffect(() => {
    let filtered = suppliers

    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCountry) {
      filtered = filtered.filter(supplier => supplier.country === selectedCountry)
    }

    setFilteredSuppliers(filtered)
  }, [suppliers, searchTerm, selectedCountry])

  const handleOpenDialog = (supplier?: Supplier) => {
    setEditingSupplier(supplier || null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSupplier(null)
    refreshData()
  }

  const handleDeleteSupplier = async (id: string) => {
    if (confirm("¿Estás seguro? Se eliminarán también las notas asociadas.")) {
      const result = await deleteSupplierAction(id)
      if (result.success) {
        toast({ title: "Éxito", description: result.message })
        refreshData()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    }
  }

  // Obtener países únicos para el filtro
  const uniqueCountries = [...new Set(suppliers.map(s => s.country))].filter(Boolean)

  // Estadísticas
  const stats = {
    total: suppliers.length,
    verified: suppliers.filter(s => s.isVerified).length,
    averageRating: suppliers.filter(s => s.rating).reduce((acc, s) => acc + (s.rating || 0), 0) / suppliers.filter(s => s.rating).length || 0,
    countries: uniqueCountries.length
  }

  const SupplierCard = ({ supplier }: { supplier: Supplier }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {supplier.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {supplier.country}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {supplier.isVerified && (
              <div className="relative">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
              </div>
            )}
            {supplier.rating && (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="text-xs font-medium text-amber-700">{supplier.rating}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-3 w-3 text-blue-500" />
            <span className="text-muted-foreground">Fuente:</span>
            <span className="font-medium">{supplier.source}</span>
          </div>
          
          {supplier.tags && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {supplier.tags.split(",").slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors"
                  >
                    {tag.trim()}
                  </Badge>
                ))}
                {supplier.tags.split(",").length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{supplier.tags.split(",").length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Link href={`/importacion/proveedores/${supplier.id}`}>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Eye className="h-3 w-3 mr-1" />
                Ver detalles
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleOpenDialog(supplier)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteSupplier(supplier.id)} 
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-col gap-6">
        <PageHeader title="Proveedores">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="gap-1"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-1"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              className="gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300" 
              onClick={() => handleOpenDialog()}
            >
              <PlusCircle className="h-4 w-4" /> 
              Nuevo Proveedor
            </Button>
          </div>
        </PageHeader>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Award className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verificados</p>
                  <p className="text-2xl font-bold text-emerald-700">{stats.verified}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating Promedio</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.averageRating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Países</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.countries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proveedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-0 bg-white/70 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los países</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="font-semibold">País</TableHead>
                <TableHead className="font-semibold">Fuente</TableHead>
                <TableHead className="text-center font-semibold">Rating</TableHead>
                <TableHead className="text-center font-semibold">Verificado</TableHead>
                <TableHead className="font-semibold">Tags</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200">
                  <TableCell className="font-medium">
                    <Link href={`/importacion/proveedores/${supplier.id}`} className="hover:underline text-blue-600 hover:text-blue-800 transition-colors">
                      {supplier.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {supplier.country}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.source}</TableCell>
                  <TableCell className="text-center">
                    {supplier.rating && (
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-medium text-amber-700">{supplier.rating}</span>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {supplier.isVerified && (
                      <div className="flex justify-center">
                        <div className="relative">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {supplier.tags?.split(",").slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="mr-1 mb-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200">
                          {tag.trim()}
                        </Badge>
                      ))}
                      {supplier.tags && supplier.tags.split(",").length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{supplier.tags.split(",").length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/importacion/proveedores/${supplier.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDialog(supplier)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteSupplier(supplier.id)} 
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* No results */}
      {filteredSuppliers.length === 0 && (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No se encontraron proveedores</h3>
            <p className="text-sm text-muted-foreground text-center">
              {searchTerm || selectedCountry 
                ? "Intenta ajustar tus filtros de búsqueda" 
                : "¡Agrega tu primer proveedor para comenzar!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <SupplierForm supplier={editingSupplier} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>
  )
}