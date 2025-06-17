"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Package, 
  DollarSign, 
  TrendingUp,
  Hash,
  MapPin,
  ExternalLink,
  BarChart3,
  Target,
  Activity,
  AlertCircle,
  Calculator,
  TrendingDown,
  Image as ImageIcon
} from "lucide-react"
import { PageHeader } from "@/app/components/page-header"
import { DolarBlueDisplay } from "@/components/currency/DolarBlueDisplay"
import { getProductAction, updateProductImagesAction, removeProductImageAction, replaceProductImagesAction } from "../actions"
import { toast } from "sonner"
import { formatUSD } from "@/lib/costs"
import { formatARS } from "@/lib/settings"
import { useCurrency } from "@/contexts/CurrencyContext"
import type { Product, ProductBatch } from "@/lib/types"
import { CategoryList } from "@/components/ui/category-badge"
import ProductBatchView from "@/components/comercializacion/products/ProductBatchView"
import ProductGallery from "@/components/comercializacion/products/ProductGallery"
import ImageUpload from "@/components/comercializacion/products/ImageUpload"
import MercadoLibreSync from "@/components/comercializacion/products/MercadoLibreSync"
import MercadoLibreAttributesForm from '@/components/comercializacion/products/MercadoLibreAttributesForm'

// Tipo extendido para incluir lotes e imágenes
type ProductWithBatches = Product & {
  batches: ProductBatch[]
  images: string | null
  categories?: any[]
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<ProductWithBatches | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'batches' | 'gallery'>('batches')
  const { rates } = useCurrency()
  const router = useRouter()
  
  // Usar React.use() para unwrap la Promise de params
  const { id } = use(params)

  useEffect(() => {
    async function loadProduct() {
      try {
        const productData = await getProductAction(id) as ProductWithBatches
        console.log("Product data received:", productData)
        console.log("Batches count:", productData?.batches?.length || 0)
        setProduct(productData)
      } catch (error) {
        console.error("Error loading product:", error)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [id])

  // Función para manejar la carga de imágenes
  const handleImagesUploaded = async (imageUrls: string[]) => {
    try {
      const result = await updateProductImagesAction(id, imageUrls)
      if (result.success) {
        // Actualizar el estado local del producto
        if (product) {
          const existingImages = product.images ? product.images.split(',').filter(img => img.trim()) : []
          const allImages = [...existingImages, ...imageUrls].join(',')
          setProduct({ ...product, images: allImages })
        }
        toast.success(result.message)
      } else {
        toast.error(result.message || "Error al cargar las imágenes")
      }
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Error al cargar las imágenes")
    }
  }

  // Función para manejar la eliminación de imágenes
  const handleImageRemove = async (imageUrl: string) => {
    try {
      const result = await removeProductImageAction(id, imageUrl)
      if (result.success) {
        // Actualizar el estado local del producto
        if (product) {
          const existingImages = product.images ? product.images.split(',').filter(img => img.trim()) : []
          const filteredImages = existingImages.filter(img => img !== imageUrl)
          setProduct({ ...product, images: filteredImages.join(',') })
        }
        toast.success(result.message)
      } else {
        toast.error(result.message || "Error al eliminar la imagen")
      }
    } catch (error) {
      console.error("Error removing image:", error)
      toast.error("Error al eliminar la imagen")
    }
  }

  // Función para limpiar todas las imágenes
  const handleClearAllImages = async () => {
    try {
      const result = await replaceProductImagesAction(id, [])
      if (result.success) {
        // Actualizar el estado local del producto
        if (product) {
          setProduct({ ...product, images: '' })
        }
        toast.success("Todas las imágenes han sido eliminadas")
      } else {
        toast.error(result.message || "Error al eliminar las imágenes")
      }
    } catch (error) {
      console.error("Error clearing images:", error)
      toast.error("Error al eliminar las imágenes")
    }
  }

  // Función para actualizar datos del producto (para ML sync)
  const handleProductUpdate = (updatedData: Partial<ProductWithBatches>) => {
    if (product) {
      setProduct({ ...product, ...updatedData })
    }
  }

  // Calcular conversión en tiempo real si tenemos la cotización
  const realTimeConversion = product && rates ? {
    costArs: product.finalUnitCostUsd * rates.sell,
    priceArs: product.finalUnitCostUsd * rates.sell * (1 + product.markupPercentage / 100),
    difference: {
      cost: (product.finalUnitCostUsd * rates.sell) - product.finalUnitCostArs,
      price: (product.finalUnitCostUsd * rates.sell * (1 + product.markupPercentage / 100)) - product.finalPriceArs
    }
  } : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <Button asChild variant="outline" className="shadow-sm">
              <Link href="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Productos
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              <div className="h-64 bg-white rounded-lg shadow-sm animate-pulse"></div>
              <div className="h-80 bg-white rounded-lg shadow-sm animate-pulse"></div>
              <div className="h-48 bg-white rounded-lg shadow-sm animate-pulse"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 bg-white rounded-lg shadow-sm animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-pink-50/20">
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Producto no encontrado
                </h1>
                <p className="text-gray-600 max-w-md mx-auto">
                  El producto que estás buscando no existe o ha sido eliminado del sistema.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline" className="shadow-sm">
                  <Link href="/products">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Productos
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stockStatus = product.stock > 0 ? 'available' : 'out-of-stock'
  const stockColor = stockStatus === 'available' ? 'text-green-700' : 'text-red-700'
  const stockBg = stockStatus === 'available' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'

  const imageCount = product.images ? product.images.split(',').filter(img => img.trim()).length : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-900 bg-clip-text text-transparent">
                {product.name}
              </h1>
              <Badge className={`${stockColor} ${stockBg} px-3 py-1`}>
                {stockStatus === 'available' ? `✅ Stock: ${product.stock}` : '❌ Sin Stock'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Detalles del producto, lotes y trazabilidad de costos
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Información del Producto - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card de Información Básica */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  Información del Producto
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nombre</p>
                    <p className="font-semibold text-gray-900 text-lg">{product.name}</p>
                  </div>
                  
                  {product.internalCode && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Código Interno</p>
                      <Badge variant="outline" className="px-3 py-1 text-sm">
                        <Hash className="h-3 w-3 mr-1" />
                        {product.internalCode}
                      </Badge>
                    </div>
                  )}

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Stock Total</span>
                      </div>
                      <span className="text-2xl font-bold text-green-700">{product.stock}</span>
                    </div>
                  </div>

                  {product.location && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Ubicación</p>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{product.location}</span>
                      </div>
                    </div>
                  )}

                  {/* Categorías del producto */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Categorías</p>
                    <CategoryList 
                      categories={(product as any).categories || []} 
                      size="default" 
                      maxVisible={5}
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Card de Costos y Precios */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  Costos y Precios
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">Costo Unitario (USD)</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatUSD(product.finalUnitCostUsd)}
                      </p>
                      <p className="text-xs text-blue-600">Promedio ponderado de lotes</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 font-medium">Costo Unitario (ARS)</span>
                        {realTimeConversion && (
                          <Badge variant="outline" className="text-xs">
                            {realTimeConversion.difference.cost >= 0 ? '📈' : '📉'} 
                            {formatARS(Math.abs(realTimeConversion.difference.cost))}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xl font-bold text-gray-700">
                        {formatARS(product.finalUnitCostArs)}
                      </p>
                      {realTimeConversion && (
                        <p className="text-xs text-gray-600">
                          Al dólar blue actual: {formatARS(realTimeConversion.costArs)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-700 font-medium">Margen de Ganancia</span>
                      </div>
                      <p className="text-xl font-bold text-orange-700">{product.markupPercentage}%</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-purple-700 font-medium">Precio Final (ARS)</span>
                        </div>
                        {realTimeConversion && (
                          <Badge variant="outline" className="text-xs">
                            {realTimeConversion.difference.price >= 0 ? '📈' : '📉'}
                            {formatARS(Math.abs(realTimeConversion.difference.price))}
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatARS(product.finalPriceArs)}
                      </p>
                      {realTimeConversion && (
                        <p className="text-xs text-purple-600">
                          Al dólar blue actual: {formatARS(realTimeConversion.priceArs)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card del Dólar Blue */}
            <DolarBlueDisplay 
              usdAmount={product.finalUnitCostUsd}
              showConversion={true}
            />

            {/* Card de Sincronización MercadoLibre */}
            <MercadoLibreSync 
              product={product}
              onProductUpdate={handleProductUpdate}
            />

            {/* Mostrar formulario de atributos si hay una categoría seleccionada */}
            {(product as any).mlCategoryId && (
              <MercadoLibreAttributesForm
                productId={product.id}
                categoryId={(product as any).mlCategoryId}
                onAttributesSaved={() => {
                  // Opcional: refrescar el producto después de guardar atributos
                  console.log('Atributos guardados exitosamente')
                }}
              />
            )}
          </div>

          {/* Área Principal - Lotes e Imágenes con Tabs */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              {/* Header con Tabs */}
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 rounded-t-lg pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-violet-900">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      {activeTab === 'batches' ? (
                        <Activity className="h-5 w-5 text-violet-600" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-violet-600" />
                      )}
                    </div>
                    {activeTab === 'batches' ? 'Historial de Lotes' : 'Galería de Imágenes'}
                  </CardTitle>
                </div>
                
                {/* Tabs Navigation */}
                <div className="flex space-x-1 mt-4">
                  <button
                    onClick={() => setActiveTab('batches')}
                    className={`px-4 py-2 rounded-t-md text-sm font-medium transition-all duration-200 ${
                      activeTab === 'batches'
                        ? 'bg-white text-violet-700 border-b-2 border-violet-500 shadow-sm'
                        : 'text-violet-600 hover:text-violet-700 hover:bg-violet-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Lotes ({product.batches?.length || 0})
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`px-4 py-2 rounded-t-md text-sm font-medium transition-all duration-200 ${
                      activeTab === 'gallery'
                        ? 'bg-white text-violet-700 border-b-2 border-violet-500 shadow-sm'
                        : 'text-violet-600 hover:text-violet-700 hover:bg-violet-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Imágenes ({imageCount})
                    </div>
                  </button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {activeTab === 'batches' ? (
                  <ProductBatchView
                    batches={product.batches || []}
                    productName={product.name}
                    totalStock={product.stock}
                    averageCost={product.finalUnitCostUsd}
                  />
                ) : (
                  <div className="p-6">
                    <ProductGallery
                      images={product.images ? product.images.split(',').filter((img: string) => img.trim()) : []}
                      productName={product.name}
                      onUpload={() => setIsUploadOpen(true)}
                      onRemoveImage={handleImageRemove}
                      onClearAllImages={handleClearAllImages}
                      canEdit={true}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de carga de imágenes */}
        <ImageUpload
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onImagesUploaded={handleImagesUploaded}
          productName={product.name}
          maxImages={10}
        />
      </div>
    </div>
  )
}