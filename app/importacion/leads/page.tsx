"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  MoreHorizontal, 
  PlusCircle, 
  Search, 
  Grid3X3, 
  List, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Users,
  Eye,
  Edit,
  Trash2,
  Layers,
  Activity,
  Star,
  Building2,
  Box,
  Tag as TagIcon
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
import { LeadForm } from "./components/lead-form"
import { PageHeader } from "@/app/components/page-header"
import { getProductLeadsAction, getSuppliersAction } from "./actions"
import type { ProductLead, Supplier } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

export default function ProductLeadsPage() {
  const [leads, setLeads] = useState<ProductLead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<ProductLead[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<ProductLead | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const { toast } = useToast()
  const [dataVersion, setDataVersion] = useState(0)
  const refreshData = () => setDataVersion((v) => v + 1)

  useEffect(() => {
    async function loadData() {
      const [leadsData, suppliersData] = await Promise.all([getProductLeadsAction(), getSuppliersAction()])
      setLeads(leadsData)
      setSuppliers(suppliersData)
      setFilteredLeads(leadsData)
    }
    loadData()
  }, [dataVersion])

  // Filtros y búsqueda
  useEffect(() => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.tags?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suppliers.find(s => s.id === lead.supplierId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(lead => lead.category === selectedCategory)
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, selectedCategory, suppliers])

  const handleOpenDialog = (lead?: ProductLead) => {
    setEditingLead(lead || null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingLead(null)
    refreshData()
  }

  // Obtener categorías únicas para el filtro
  const uniqueCategories = [...new Set(leads.map(l => l.category))].filter(Boolean)

  // Estadísticas
  const stats = {
    total: leads.length,
    withPrice: leads.filter(l => l.referencePriceUsd).length,
    averagePrice: leads.filter(l => l.referencePriceUsd).reduce((acc, l) => acc + (l.referencePriceUsd || 0), 0) / leads.filter(l => l.referencePriceUsd).length || 0,
    categories: uniqueCategories.length,
    suppliers: new Set(leads.map(l => l.supplierId)).size
  }

  const LeadCard = ({ lead }: { lead: ProductLead }) => {
    const supplier = suppliers.find(s => s.id === lead.supplierId)
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {lead.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {supplier?.name || 'Proveedor desconocido'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {lead.category && (
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-purple-200">
                  {lead.category}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {lead.photoUrl && (
              <img
                src={lead.photoUrl}
                alt={lead.name}
                className="w-full h-32 object-cover rounded-lg"
              />
            )}
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              {lead.referencePriceUsd && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-green-500" />
                  <span className="text-muted-foreground">Precio:</span>
                  <span className="font-medium">${lead.referencePriceUsd.toFixed(2)}</span>
                </div>
              )}
              
              {lead.moq && (
                <div className="flex items-center gap-1">
                  <Layers className="h-3 w-3 text-blue-500" />
                  <span className="text-muted-foreground">MOQ:</span>
                  <span className="font-medium">{lead.moq}</span>
                </div>
              )}
            </div>
            
            {lead.tags && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {lead.tags.split(",").slice(0, 3).map((tag, index) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
                  {lead.tags.split(",").length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{lead.tags.split(",").length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <Link href={`/leads/${lead.id}`}>
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
                  <DropdownMenuItem onClick={() => handleOpenDialog(lead)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-col gap-6">
        <PageHeader title="Leads de Producto">
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
              Nuevo Lead
            </Button>
          </div>
        </PageHeader>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Con Precio</p>
                  <p className="text-2xl font-bold text-green-700">{stats.withPrice}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Precio Promedio</p>
                  <p className="text-2xl font-bold text-amber-700">${stats.averagePrice.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Layers className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categorías</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.categories}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Proveedores</p>
                  <p className="text-2xl font-bold text-indigo-700">{stats.suppliers}</p>
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
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-0 bg-white/70 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="font-semibold">Proveedor</TableHead>
                <TableHead className="font-semibold">Categoría</TableHead>
                <TableHead className="text-right font-semibold">Precio Ref. (USD)</TableHead>
                <TableHead className="font-semibold">MOQ</TableHead>
                <TableHead className="font-semibold">Tags</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const supplier = suppliers.find((s) => s.id === lead.supplierId)
                return (
                  <TableRow key={lead.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200">
                    <TableCell className="font-medium">
                      <Link href={`/leads/${lead.id}`} className="hover:underline text-blue-600 hover:text-blue-800 transition-colors">
                        {lead.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {supplier?.name || lead.supplierId}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.category && (
                        <Badge variant="secondary" className="bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-purple-200">
                          {lead.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {lead.referencePriceUsd ? (
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          <span className="font-medium">${lead.referencePriceUsd.toFixed(2)}</span>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{lead.moq || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lead.tags?.split(",").slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="mr-1 mb-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200">
                            {tag.trim()}
                          </Badge>
                        ))}
                        {lead.tags && lead.tags.split(",").length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lead.tags.split(",").length - 2}
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
                            <Link href={`/leads/${lead.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDialog(lead)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* No results */}
      {filteredLeads.length === 0 && (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No se encontraron leads</h3>
            <p className="text-sm text-muted-foreground text-center">
              {searchTerm || selectedCategory 
                ? "Intenta ajustar tus filtros de búsqueda" 
                : "¡Agrega tu primer lead para comenzar!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <LeadForm lead={editingLead} suppliers={suppliers} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
