"use client"

import { useState, useEffect } from "react"
import { 
  MoreHorizontal, 
  PlusCircle, 
  Eye, 
  Search,
  Grid3X3,
  List,
  Package,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  Hash,
  Edit,
  Trash2,
  ShoppingCart,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProductForm } from "./components/product-form"
import { deleteProductAction } from "./actions"
import { useToast } from "@/components/ui/use-toast"
import { getProductsAction, getProductLeadsAction } from "./actions"
import type { Product, ProductLead } from "@/lib/types"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [productLeads, setProductLeads] = useState<ProductLead[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [dataVersion, setDataVersion] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      const [productsData, leadsData] = await Promise.all([getProductsAction(), getProductLeadsAction()])
      setProducts(productsData)
      setFilteredProducts(productsData)
      setProductLeads(leadsData)
    }
    loadData()
  }, [dataVersion])

  // Filtros y búsqueda
  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.internalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm])

  const handleOpenDialog = (product?: Product) => {
    setEditingProduct(product || null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setDataVersion(v => v + 1)
  }

  const handleDeleteProduct = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      const result = await deleteProductAction(id)
      if (result.success) {
        toast({ 
          title: "¡Éxito!", 
          description: result.message,
          className: "bg-green-50 border-green-200 text-green-800"
        })
        setProducts((prev) => prev.filter((p) => p.id !== id))
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    }
  }

  // Estadísticas
  const stats = {
    total: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalValue: products.reduce((sum, p) => sum + (p.finalPriceArs * p.stock), 0),
    avgMargin: products.length > 0 ? products.reduce((sum, p) => sum + p.markupPercentage, 0) / products.length : 0,
    outOfStock: products.filter(p => p.stock === 0).length
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {product.name}
            </CardTitle>
            {product.internalCode && (
              <Badge variant="outline" className="text-xs">
                {product.internalCode}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              variant={product.stock > 0 ? "default" : "destructive"} 
              className={product.stock > 0 
                ? "text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" 
                : "text-red-700 bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
              }
            >
              Stock: {product.stock}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-blue-500" />
                <span className="text-muted-foreground">Costo USD:</span>
              </div>
              <span className="font-semibold text-blue-700">${product.finalUnitCostUsd.toFixed(2)}</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-orange-500" />
                <span className="text-muted-foreground">Margen:</span>
              </div>
              <span className="font-semibold text-orange-700">{product.markupPercentage}%</span>
            </div>
          </div>
          
          <div className="p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600 font-medium">Precio Final</span>
              <span className="text-lg font-bold text-purple-700">
                ${product.finalPriceArs.toFixed(2)} ARS
              </span>
            </div>
          </div>

          {product.location && (
            <div className="text-xs text-muted-foreground">
              <span>📍 {product.location}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Link href={`/products/${product.id}`}>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Eye className="h-3 w-3 mr-1" />
                Ver lotes
              </Button>
            </Link>
            {product.mlListingUrl && (
              <Link href={product.mlListingUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  ML
                </Button>
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/products/${product.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Lotes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-red-600">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-900 bg-clip-text text-transparent">
              Lista de Productos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus productos finales con costos, precios y stock
            </p>
          </div>
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
              className="gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => handleOpenDialog()}
            >
              <PlusCircle className="h-4 w-4" /> 
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Productos</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Hash className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Total</p>
                  <p className="text-2xl font-bold text-green-700">{stats.totalStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ${(stats.totalValue / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margen Prom.</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.avgMargin.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Activity className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sin Stock</p>
                  <p className="text-2xl font-bold text-red-700">{stats.outOfStock}</p>
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
                placeholder="Buscar productos por nombre, código o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-0 bg-white/70 backdrop-blur-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      {products.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No hay productos aún</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Crea tu primer producto para empezar a gestionar tu inventario.
            </p>
            <Button size="sm" className="gap-1 bg-gradient-to-r from-purple-600 to-indigo-600" onClick={() => handleOpenDialog()}>
              <PlusCircle className="h-4 w-4" /> Crear Nuevo Producto
            </Button>
          </CardContent>
        </Card>
      ) : filteredProducts.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text text-transparent">
                Lista de Productos
              </CardTitle>
              <CardDescription>
                Gestiona tus productos finales con costos y precios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Costo U. (USD)</TableHead>
                    <TableHead className="font-semibold">Costo U. (ARS)</TableHead>
                    <TableHead className="font-semibold">Precio Final (ARS)</TableHead>
                    <TableHead className="font-semibold">Stock</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-indigo-50/30 transition-all duration-200">
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          {product.internalCode && (
                            <Badge variant="outline" className="text-xs">
                              {product.internalCode}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-blue-700">
                          ${product.finalUnitCostUsd.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          ${product.finalUnitCostArs.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-purple-700">
                          ${product.finalPriceArs.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.stock > 0 ? "default" : "destructive"}
                          className={product.stock > 0 
                            ? "text-green-700 bg-green-50 border-green-200" 
                            : "text-red-700 bg-red-50 border-red-200"
                          }
                        >
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" className="hover:bg-purple-50">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${product.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Lotes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No se encontraron productos</h3>
            <p className="text-sm text-muted-foreground text-center">
              Intenta ajustar tu búsqueda
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <ProductForm
            product={editingProduct}
            productLead={null}
            onClose={handleCloseDialog}
            allProductLeads={productLeads}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
