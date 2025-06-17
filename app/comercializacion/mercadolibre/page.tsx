"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  Package, 
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Settings,
  Link,
  Trash2
} from "lucide-react"
import {
  importMLListingAction,
  syncAllMLListingsAction,
  getMLListingsWithMappingsAction,
  removeMLListingAction,
  updateMLListingStockAction,
  connectMLListingToProductsAction
} from "./sync-actions"

interface MLListing {
  id: string
  mlItemId: string
  title: string
  price: number
  status: string
  permalink?: string
  thumbnail?: string
  freeShipping: boolean
  lastSyncAt?: Date
  syncErrors?: string
  stockMappings: Array<{
    id: string
    quantity: number
    priority: number
    product: {
      id: string
      name: string
      stock: number
      internalCode?: string
      productLead: {
        name: string
      }
    }
  }>
}

interface Product {
  id: string
  name: string
  stock: number
  internalCode?: string
  productLead: {
    name: string
  }
}

interface ProductMapping {
  productId: string
  quantity: number
  priority: number
}

export default function MercadoLibrePage() {
  const [listings, setListings] = useState<MLListing[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [importLoading, setImportLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [mlItemId, setMlItemId] = useState("")
  
  // Estados para el modal de conexión
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<MLListing | null>(null)
  const [productMappings, setProductMappings] = useState<ProductMapping[]>([{ productId: "", quantity: 1, priority: 1 }])
  const [connectLoading, setConnectLoading] = useState(false)
  
  const { toast } = useToast()

  // Cargar publicaciones y productos al montar el componente
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadListings(), loadProducts()])
  }

  const loadListings = async () => {
    try {
      setLoading(true)
      const result = await getMLListingsWithMappingsAction()
      if (result.success) {
        setListings(result.listings as MLListing[])
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        })
      }
    } catch (error) {
      console.error('Error loading listings:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error cargando las publicaciones"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/productos')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleImportListing = async () => {
    if (!mlItemId.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa un código MLA válido"
      })
      return
    }

    try {
      setImportLoading(true)
      const result = await importMLListingAction(mlItemId.trim())
      
      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message
        })
        setMlItemId("")
        await loadListings()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        })
      }
    } catch (error) {
      console.error('Error importing listing:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error importando la publicación"
      })
    } finally {
      setImportLoading(false)
    }
  }

  // Función para abrir el modal de conexión
  const handleOpenConnectDialog = (listing: MLListing) => {
    setSelectedListing(listing)
    
    // Si ya tiene mapeos, cargarlos
    if (listing.stockMappings.length > 0) {
      setProductMappings(listing.stockMappings.map(mapping => ({
        productId: mapping.product.id,
        quantity: mapping.quantity,
        priority: mapping.priority
      })))
    } else {
      setProductMappings([{ productId: "", quantity: 1, priority: 1 }])
    }
    
    setConnectDialogOpen(true)
  }

  // Función para agregar un nuevo mapeo
  const addProductMapping = () => {
    const nextPriority = Math.max(...productMappings.map(m => m.priority), 0) + 1
    setProductMappings([...productMappings, { productId: "", quantity: 1, priority: nextPriority }])
  }

  // Función para eliminar un mapeo
  const removeProductMapping = (index: number) => {
    setProductMappings(productMappings.filter((_, i) => i !== index))
  }

  // Función para actualizar un mapeo
  const updateProductMapping = (index: number, field: keyof ProductMapping, value: string | number) => {
    const updated = [...productMappings]
    updated[index] = { ...updated[index], [field]: value }
    setProductMappings(updated)
  }

  // Función para conectar productos
  const handleConnectProducts = async () => {
    if (!selectedListing) return

    // Validar que todos los mapeos estén completos
    const validMappings = productMappings.filter(m => m.productId && m.quantity > 0 && m.priority > 0)
    
    if (validMappings.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar al menos un producto"
      })
      return
    }

    // Validar que no haya productos duplicados
    const productIds = validMappings.map(m => m.productId)
    const uniqueProductIds = new Set(productIds)
    
    if (productIds.length !== uniqueProductIds.size) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No puedes seleccionar el mismo producto varias veces. Si necesitas más cantidad, edita la cantidad del producto existente."
      })
      return
    }

    // Validar prioridades únicas
    const priorities = validMappings.map(m => m.priority)
    const uniquePriorities = new Set(priorities)
    
    if (priorities.length !== uniquePriorities.size) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cada producto debe tener una prioridad única"
      })
      return
    }

    try {
      setConnectLoading(true)
      const result = await connectMLListingToProductsAction(selectedListing.id, validMappings)
      
      if (result.success) {
        // Manejar diferentes tipos de éxito
        if (result.stockWarning) {
          // Éxito con advertencia de stock
          toast({
            title: "✅ Productos conectados",
            description: result.message,
            variant: "default",
            className: "bg-orange-50 border-orange-200 text-orange-800"
          })
        } else if (result.stockError) {
          // Éxito con error de stock
          toast({
            title: "⚠️ Productos conectados",
            description: result.message,
            variant: "default",
            className: "bg-yellow-50 border-yellow-200 text-yellow-800"
          })
        } else {
          // Éxito completo
          toast({
            title: "🎉 ¡Éxito completo!",
            description: result.message
          })
        }
        
        setConnectDialogOpen(false)
        await loadListings()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        })
      }
    } catch (error) {
      console.error('Error connecting products:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error conectando productos"
      })
    } finally {
      setConnectLoading(false)
    }
  }

  const handleSyncAll = async () => {
    try {
      setSyncLoading(true)
      const result = await syncAllMLListingsAction()
      
      if (result.success) {
        toast({
          title: "Sincronización completada",
          description: result.message
        })
        await loadListings()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        })
      }
    } catch (error) {
      console.error('Error syncing listings:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error sincronizando las publicaciones"
      })
    } finally {
      setSyncLoading(false)
    }
  }

  const handleSyncSingle = async (listingId: string) => {
    try {
      const result = await updateMLListingStockAction(listingId)
      
      if (result.success) {
        toast({
          title: "Stock actualizado",
          description: result.message
        })
        await loadListings()
      } else {
        // Verificar si es una advertencia en lugar de un error
        if (result.isWarning) {
          toast({
            title: "⚠️ Advertencia",
            description: result.message,
            variant: "default",
            className: "bg-orange-50 border-orange-200 text-orange-800"
          })
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message
          })
        }
        await loadListings() // Actualizar para mostrar el estado
      }
    } catch (error) {
      console.error('Error syncing single listing:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error sincronizando la publicación"
      })
    }
  }

  const handleRemoveListing = async (listingId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta publicación de la sincronización?")) {
      return
    }

    try {
      const result = await removeMLListingAction(listingId)
      
      if (result.success) {
        toast({
          title: "Publicación eliminada",
          description: result.message
        })
        await loadListings()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        })
      }
    } catch (error) {
      console.error('Error removing listing:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error eliminando la publicación"
      })
    }
  }

  const getStatusBadge = (status: string, hasErrors: boolean, syncErrors?: string) => {
    if (hasErrors) {
      // Verificar si es una advertencia
      if (syncErrors?.startsWith('WARNING:')) {
        return <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200">
          <AlertCircle className="w-3 h-3" />
          Advertencia
        </Badge>
      }
      
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Error
      </Badge>
    }

    switch (status) {
      case 'active':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
          <CheckCircle className="w-3 h-3" />
          Activa
        </Badge>
      case 'paused':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pausada
        </Badge>
      case 'closed':
        return <Badge variant="outline">Cerrada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calculateAvailableStock = (listing: MLListing) => {
    if (listing.stockMappings.length === 0) return 0

    let availableStock = Infinity
    
    for (const mapping of listing.stockMappings) {
      const productStock = mapping.product.stock
      const possibleUnits = Math.floor(productStock / mapping.quantity)
      availableStock = Math.min(availableStock, possibleUnits)
    }

    return availableStock === Infinity ? 0 : availableStock
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Cargando publicaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de MercadoLibre</h1>
          <p className="text-muted-foreground">
            Importa y sincroniza publicaciones de MercadoLibre con tu inventario
          </p>
        </div>
        <Button 
          onClick={handleSyncAll}
          disabled={syncLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
          Sincronizar Todo
        </Button>
      </div>

      {/* Formulario de importación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Importar Publicación
          </CardTitle>
          <CardDescription>
            Ingresa el código MLA de una publicación existente en MercadoLibre para importarla
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="mlItemId">Código MLA (ej: MLA1234567890)</Label>
              <Input
                id="mlItemId"
                value={mlItemId}
                onChange={(e) => setMlItemId(e.target.value)}
                placeholder="MLA1234567890"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleImportListing}
                disabled={importLoading}
                className="flex items-center gap-2"
              >
                {importLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Importar
              </Button>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Primero crea tu publicación directamente en MercadoLibre, 
              luego usa el código MLA para importarla aquí y conectarla con tus productos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Separator />

      {/* Lista de publicaciones */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">
            Publicaciones Sincronizadas ({listings.length})
          </h2>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay publicaciones importadas</h3>
              <p className="text-muted-foreground mb-4">
                Importa tu primera publicación usando el código MLA
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{listing.title}</CardTitle>
                        {getStatusBadge(listing.status, !!listing.syncErrors, listing.syncErrors)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${listing.price.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          Stock: {calculateAvailableStock(listing)}
                        </span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {listing.mlItemId}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.permalink && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(listing.permalink, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSyncSingle(listing.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveListing(listing.id)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {listing.syncErrors && (
                    <Alert variant={listing.syncErrors.startsWith('WARNING:') ? "default" : "destructive"} 
                           className={listing.syncErrors.startsWith('WARNING:') ? "bg-orange-50 border-orange-200" : ""}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{listing.syncErrors.startsWith('WARNING:') ? "Advertencia:" : "Error de sincronización:"}</strong>{" "}
                        {listing.syncErrors.replace('WARNING: ', '')}
                        {listing.syncErrors.startsWith('WARNING:') && (
                          <div className="mt-2 text-sm">
                            <strong>Sugerencias:</strong>
                            <ul className="list-disc list-inside mt-1">
                              <li>Espera a que se completen las ventas en proceso</li>
                              <li>O pausa temporalmente la publicación en MercadoLibre</li>
                            </ul>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {listing.stockMappings.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Productos conectados:</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenConnectDialog(listing)}
                          className="flex items-center gap-1"
                        >
                          <Settings className="w-4 h-4" />
                          Editar
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {listing.stockMappings.map((mapping, index) => (
                          <div key={mapping.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{mapping.product.productLead.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {mapping.product.internalCode && (
                                  <span className="mr-2">Código: {mapping.product.internalCode}</span>
                                )}
                                Stock disponible: {mapping.product.stock}
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div>Cantidad: {mapping.quantity}</div>
                              <div className="text-muted-foreground">Prioridad: {mapping.priority}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Esta publicación no tiene productos conectados. 
                        <Button variant="link" className="p-0 h-auto ml-2" onClick={() => handleOpenConnectDialog(listing)}>
                          Conectar productos
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {listing.lastSyncAt && (
                    <div className="text-xs text-muted-foreground">
                      Última sincronización: {new Date(listing.lastSyncAt).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de conexión */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Conectar Productos</DialogTitle>
            <DialogDescription>
              {selectedListing ? `Conecta productos con "${selectedListing.title}"` : "Selecciona los productos para conectar"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {productMappings.map((mapping, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Label>Producto</Label>
                  <Select value={mapping.productId} onValueChange={(value) => updateProductMapping(index, 'productId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                                         <SelectContent>
                       {products.map((product) => {
                         // Verificar si este producto ya está seleccionado en otros mapeos
                         const isAlreadySelected = productMappings.some((m, i) => i !== index && m.productId === product.id)
                         
                         return (
                           <SelectItem 
                             key={product.id} 
                             value={product.id} 
                             disabled={isAlreadySelected}
                           >
                             <div className="flex flex-col">
                               <span className={isAlreadySelected ? "text-muted-foreground" : ""}>
                                 {product.productLead.name}
                                 {isAlreadySelected && " (Ya seleccionado)"}
                               </span>
                               <span className="text-xs text-muted-foreground">
                                 Stock: {product.stock} {product.internalCode && `• ${product.internalCode}`}
                               </span>
                             </div>
                           </SelectItem>
                         )
                       })}
                     </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={mapping.quantity}
                    onChange={(e) => updateProductMapping(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Prioridad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={mapping.priority}
                    onChange={(e) => updateProductMapping(index, 'priority', parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div className="col-span-2">
                  {productMappings.length > 1 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeProductMapping(index)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="col-span-1">
                  {index === productMappings.length - 1 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addProductMapping}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
                     <div className="border-t pt-4">
             <Alert className="mb-4">
               <AlertCircle className="h-4 w-4" />
               <AlertDescription>
                 <strong>Importante:</strong>
                 <ul className="mt-2 space-y-1 text-sm">
                   <li>• <strong>Cantidad:</strong> Cuántas unidades del producto se necesitan por cada venta en ML</li>
                   <li>• <strong>Prioridad:</strong> Orden de descuento de stock (1 = más prioritario)</li>
                   <li>• <strong>No puedes seleccionar el mismo producto dos veces</strong> - Si necesitas más cantidad, edita la cantidad existente</li>
                 </ul>
               </AlertDescription>
             </Alert>
           </div>
          
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConnectProducts} disabled={connectLoading}>
              {connectLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Conectando...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Conectar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 