"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ShoppingCart,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Settings,
  Pause,
  Play,
  RefreshCw,
  Upload,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"
import {
  searchMercadoLibreCategoriesAction,
  getCategoryDetailsAction,
  saveProductCategoryAction,
  syncProductToMercadoLibreAction,
  pauseProductSyncAction,
  getProductMLStatusAction,
  getRequiredAttributesAction,
  saveProductAttributesAction
} from "@/app/comercializacion/mercadolibre/sync-actions"
import type { Product } from "@/lib/types"

type ProductWithML = Product & {
  mlItemId?: string | null
  mlStatus?: string | null
  mlCategoryId?: string | null
  mlLastSync?: Date | null
  mlSyncEnabled?: boolean | null
  mlSyncErrors?: string | null
}

interface MercadoLibreSyncProps {
  product: ProductWithML
  onProductUpdate: (updatedProduct: Partial<ProductWithML>) => void
}

interface MLCategory {
  id: string
  name: string
}

interface MLAttribute {
  id: string
  name: string
  type: string
  required: boolean
  value_type: string
  values?: Array<{
    id: string
    name: string
  }>
}

interface AttributeValue {
  [attributeId: string]: string
}

type SyncStep = 'category' | 'attributes' | 'final'

export default function MercadoLibreSync({ product, onProductUpdate }: MercadoLibreSyncProps) {
  const [isPending, startTransition] = useTransition()
  const [isSearchingCategories, setIsSearchingCategories] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isGettingStatus, setIsGettingStatus] = useState(false)
  const [categories, setCategories] = useState<MLCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(product.mlCategoryId || '')
  const [categoryDetails, setCategoryDetails] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState(product.name)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [currentStep, setCurrentStep] = useState<SyncStep>('category')
  const [requiredAttributes, setRequiredAttributes] = useState<MLAttribute[]>([])
  const [attributeValues, setAttributeValues] = useState<AttributeValue>({})

  // Buscar categorías
  const handleSearchCategories = () => {
    if (!searchQuery.trim()) {
      toast.error('Ingresa un término de búsqueda')
      return
    }

    startTransition(async () => {
      const result = await searchMercadoLibreCategoriesAction(searchQuery)
      if (result.success && result.categories) {
        setCategories(result.categories)
        toast.success(`Encontradas ${result.categories.length} categorías`)
      } else {
        toast.error(result.message || 'Error buscando categorías')
      }
    })
  }

  // Obtener detalles de categoría
  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId)
    try {
      const result = await getCategoryDetailsAction(categoryId)
      if (result.success) {
        setCategoryDetails(result.details)
      }
    } catch (error) {
      console.error('Error getting category details:', error)
    }
  }

  // Continuar al paso de atributos
  const handleContinueToAttributes = async () => {
    if (!selectedCategory) {
      toast.error('Selecciona una categoría primero')
      return
    }

    try {
      // Guardar la categoría seleccionada
      const saveResult = await saveProductCategoryAction(product.id, selectedCategory)
      if (!saveResult.success) {
        toast.error(saveResult.message)
        return
      }

      // Obtener atributos requeridos
      const attributesResult = await getRequiredAttributesAction(selectedCategory)
      if (attributesResult.success) {
        setRequiredAttributes(attributesResult.attributes)
        setCurrentStep('attributes')
        onProductUpdate({ 
          mlCategoryId: selectedCategory,
          mlSyncEnabled: true
        })
        toast.success('Categoría guardada. Configura los atributos requeridos.')
      } else {
        toast.error(attributesResult.message)
      }
    } catch (error) {
      toast.error('Error obteniendo atributos de la categoría')
    }
  }

  // Guardar categoría seleccionada
  const handleSaveCategory = async () => {
    if (!selectedCategory) {
      toast.error('Selecciona una categoría')
      return
    }

    try {
      const result = await saveProductCategoryAction(product.id, selectedCategory)
      if (result.success) {
        toast.success(result.message)
        onProductUpdate({ 
          mlCategoryId: selectedCategory,
          mlSyncEnabled: true
        })
        setShowCategoryDialog(false)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Error guardando categoría')
    }
  }

  // Actualizar valor de atributo
  const handleAttributeChange = (attributeId: string, value: string) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }))
  }

  // Continuar al paso final
  const handleContinueToFinal = async () => {
    // Verificar que todos los atributos requeridos estén completos
    const missingAttributes = requiredAttributes.filter(attr => 
      !attributeValues[attr.id]?.trim()
    )

    if (missingAttributes.length > 0) {
      toast.error(`Completa estos campos: ${missingAttributes.map(attr => attr.name).join(', ')}`)
      return
    }

    try {
      // Guardar los atributos
      const result = await saveProductAttributesAction(product.id, attributeValues)
      if (result.success) {
        toast.success('Atributos guardados exitosamente')
        setCurrentStep('final')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Error guardando atributos')
    }
  }

  // Sincronizar producto
  const handleSync = () => {
    startTransition(async () => {
      const result = await syncProductToMercadoLibreAction(product.id)
      if (result.success) {
        toast.success(result.message)
        onProductUpdate({
          mlItemId: result.product?.mlItemId,
          mlStatus: result.product?.mlStatus,
          mlLastSync: result.product?.mlLastSync,
          mlSyncErrors: null,
          mlListingUrl: result.product?.mlListingUrl
        })
        setCurrentStep('category') // Reset
      } else {
        toast.error(result.message)
      }
    })
  }

  // Pausar sincronización
  const handlePause = () => {
    startTransition(async () => {
      const result = await pauseProductSyncAction(product.id)
      if (result.success) {
        toast.success(result.message)
        onProductUpdate({
          mlStatus: 'paused',
          mlSyncEnabled: false,
          mlLastSync: new Date()
        })
      } else {
        toast.error(result.message)
      }
    })
  }

  // Verificar estado en ML
  const handleCheckStatus = async () => {
    setIsGettingStatus(true)
    try {
      const result = await getProductMLStatusAction(product.id)
      if (result.success) {
        toast.success('Estado actualizado desde MercadoLibre')
        onProductUpdate({
          mlStatus: result.mlItem.status,
          mlLastSync: new Date()
        })
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Error verificando estado')
    } finally {
      setIsGettingStatus(false)
    }
  }

  const getStatusBadge = () => {
    if (!product.mlItemId) {
      return <Badge variant="outline">No sincronizado</Badge>
    }

    switch (product.mlStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Activo</Badge>
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pausado</Badge>
      case 'closed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cerrado</Badge>
      default:
        return <Badge variant="outline">{product.mlStatus || 'Desconocido'}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-yellow-500" />
          Sincronización MercadoLibre
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicador de pasos */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${currentStep === 'category' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'category' ? 'bg-blue-100 text-blue-600' : 
              selectedCategory ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {selectedCategory ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-sm font-medium">Categoría</span>
          </div>
          
          <div className={`flex items-center gap-2 ${currentStep === 'attributes' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'attributes' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Atributos</span>
          </div>
          
          <div className={`flex items-center gap-2 ${currentStep === 'final' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'final' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Publicar</span>
          </div>
        </div>

        {/* Paso 1: Seleccionar Categoría */}
        {currentStep === 'category' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Buscar categoría por nombre del producto</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="search"
                  placeholder="ej: cable usb, auriculares, etc."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchCategories()}
                />
                <Button 
                  onClick={handleSearchCategories}
                  disabled={isPending}
                  size="icon"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Categorías encontradas</Label>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedCategory === category.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleContinueToAttributes}
                  disabled={isPending}
                  className="flex-1"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Cargando atributos...
                    </>
                  ) : (
                    'Continuar con Atributos'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Configurar Atributos */}
        {currentStep === 'attributes' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-amber-600">
                Completa todos los campos requeridos para la categoría seleccionada
              </span>
            </div>

            <div className="grid gap-4">
              {requiredAttributes.map((attribute) => (
                <div key={attribute.id} className="space-y-2">
                  <Label htmlFor={attribute.id}>
                    {attribute.name} <span className="text-red-500">*</span>
                  </Label>
                  
                  {attribute.values && attribute.values.length > 0 ? (
                    <Select 
                      value={attributeValues[attribute.id] || ''} 
                      onValueChange={(value) => handleAttributeChange(attribute.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecciona ${attribute.name.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {attribute.values.map((value) => (
                          <SelectItem key={value.id} value={value.name}>
                            {value.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={attribute.id}
                      placeholder={`Ingresa ${attribute.name.toLowerCase()}`}
                      value={attributeValues[attribute.id] || ''}
                      onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
                    />
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Tipo: {attribute.type} | ID: {attribute.id}
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleContinueToFinal}
              disabled={isPending}
              className="w-full"
            >
              Continuar al paso final
            </Button>
          </div>
        )}

        {/* Paso 3: Publicar */}
        {currentStep === 'final' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Listo para publicar</span>
              </div>
              <div className="text-sm text-green-700">
                Categoría y atributos configurados correctamente. 
                {!product.images && (
                  <div className="mt-2 text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    ⚠️ Considera agregar imágenes para mejorar la visibilidad del producto
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSync}
                disabled={isPending}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Publicando...
                  </>
                ) : (
                  'Publicar en MercadoLibre'
                )}
              </Button>

              {product.mlItemId && (
                <Button 
                  variant="outline"
                  onClick={handlePause}
                  disabled={isPending}
                >
                  Pausar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Estado actual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Estado:</span>
            {getStatusBadge()}
          </div>
          {product.mlItemId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckStatus}
              disabled={isGettingStatus}
            >
              {isGettingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Información de sincronización */}
        {product.mlLastSync && (
          <div className="text-xs text-gray-500">
            Última sincronización: {new Date(product.mlLastSync).toLocaleString()}
          </div>
        )}

        {/* Errores */}
        {product.mlSyncErrors && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {product.mlSyncErrors}
            </div>
          </div>
        )}

        {/* URL de la publicación */}
        {product.mlListingUrl && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Publicación:</span>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto"
              onClick={() => window.open(product.mlListingUrl!, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Ver en ML
            </Button>
          </div>
        )}

        {/* Categoría seleccionada */}
        {product.mlCategoryId && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Categoría ML:</span>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {product.mlCategoryId}
            </code>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2">
          {!product.mlCategoryId ? (
            // Si no hay categoría, mostrar botón para configurar
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-500 hover:bg-yellow-600">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar ML
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configurar MercadoLibre</DialogTitle>
                  <DialogDescription>
                    Busca y selecciona la categoría adecuada para tu producto
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Búsqueda */}
                  <div className="space-y-2">
                    <Label htmlFor="search">Buscar categoría</Label>
                    <div className="flex gap-2">
                      <Input
                        id="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ingresa el nombre del producto..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchCategories()}
                      />
                      <Button 
                        onClick={handleSearchCategories}
                        disabled={isSearchingCategories}
                      >
                        {isSearchingCategories ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Resultados */}
                  {categories.length > 0 && (
                    <div className="space-y-2">
                      <Label>Categorías encontradas</Label>
                      <Select onValueChange={handleCategorySelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Detalles de categoría */}
                  {categoryDetails && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <h4 className="font-medium">{categoryDetails.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        ID: {categoryDetails.id}
                      </p>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowCategoryDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveCategory}
                      disabled={!selectedCategory}
                    >
                      Guardar Categoría
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            // Si ya hay categoría, mostrar acciones de sincronización
            <>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                {product.mlItemId ? 'Actualizar' : 'Publicar'} en ML
              </Button>

              {product.mlItemId && product.mlStatus === 'active' && (
                <Button
                  variant="outline"
                  onClick={handlePause}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              )}

              {product.mlItemId && product.mlStatus === 'paused' && (
                <Button
                  variant="outline"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Reactivar
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setShowCategoryDialog(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Reconfigurar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 