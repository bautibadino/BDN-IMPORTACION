"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ImageIcon, 
  ZoomIn, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Upload,
  Trash2
} from "lucide-react"

interface ProductGalleryProps {
  images: string[]
  productName: string
  onUpload?: () => void
  onRemoveImage?: (imageUrl: string) => void
  onClearAllImages?: () => void
  canEdit?: boolean
}

export default function ProductGallery({ 
  images = [], 
  productName, 
  onUpload, 
  onRemoveImage, 
  onClearAllImages,
  canEdit = false 
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const openLightbox = (index: number) => {
    setSelectedImage(index)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    setSelectedImage(null)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return
    
    if (direction === 'prev') {
      setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1)
    } else {
      setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0)
    }
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ImageIcon className="h-5 w-5 text-purple-600" />
              </div>
              Galería de Imágenes
              <Badge variant="outline" className="ml-2">
                {images.length} foto{images.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            {canEdit && (
              <div className="flex gap-2">
                <Button 
                  onClick={onUpload}
                  size="sm" 
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Foto
                </Button>
                {images.length > 0 && onClearAllImages && (
                  <Button 
                    onClick={onClearAllImages}
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Todo
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {images.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Sin imágenes
              </h3>
              <p className="text-gray-500 mb-4">
                Este producto aún no tiene fotos cargadas
              </p>
              {canEdit && (
                <Button 
                  onClick={onUpload}
                  variant="outline" 
                  className="border-dashed border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Primera Foto
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {/* Imagen principal */}
              <div className="relative group">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={images[0]}
                    alt={`${productName} - Imagen principal`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openLightbox(0)}
                        size="lg"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                      >
                        <ZoomIn className="h-5 w-5 mr-2" />
                        Ver en grande
                      </Button>
                      {canEdit && onRemoveImage && (
                        <Button
                          onClick={() => onRemoveImage(images[0])}
                          size="lg"
                          variant="destructive"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
                        >
                          <X className="h-5 w-5 mr-2" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Miniaturas adicionales */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(1, 5).map((image, index) => (
                    <div key={index + 1} className="relative group aspect-square">
                      <div className="relative w-full h-full rounded-md overflow-hidden bg-gray-100 cursor-pointer">
                        <Image
                          src={image}
                          alt={`${productName} - Imagen ${index + 2}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          onClick={() => openLightbox(index + 1)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                          <div className="flex gap-1">
                            <Button
                              onClick={() => openLightbox(index + 1)}
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 hover:bg-white text-gray-900 shadow-lg p-2"
                            >
                              <ZoomIn className="h-3 w-3" />
                            </Button>
                            {canEdit && onRemoveImage && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRemoveImage(image)
                                }}
                                size="sm"
                                variant="destructive"
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg p-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Mostrar contador si hay más de 5 imágenes */}
                  {images.length > 5 && (
                    <div 
                      className="relative aspect-square rounded-md bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center cursor-pointer hover:from-gray-700 hover:to-gray-800 transition-colors duration-300"
                      onClick={() => openLightbox(5)}
                    >
                      <div className="text-center">
                        <span className="text-white text-lg font-bold">+{images.length - 5}</span>
                        <p className="text-white/80 text-xs">más</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 bg-black/95">
          <DialogHeader className="absolute top-4 left-4 z-10">
            <DialogTitle className="text-white">
              {productName} - Imagen {selectedImage !== null ? selectedImage + 1 : 1} de {images.length}
            </DialogTitle>
          </DialogHeader>
          
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {canEdit && onRemoveImage && selectedImage !== null && (
              <Button
                onClick={() => {
                  onRemoveImage(images[selectedImage])
                  closeLightbox()
                }}
                size="sm"
                variant="destructive"
                className="text-white hover:bg-red-600"
              >
                <X className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
            <Button
              onClick={closeLightbox}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selectedImage !== null && (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={images[selectedImage]}
                alt={`${productName} - Imagen ${selectedImage + 1}`}
                fill
                className="object-contain"
              />
              
              {images.length > 1 && (
                <>
                  <Button
                    onClick={() => navigateImage('prev')}
                    size="lg"
                    variant="ghost"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  
                  <Button
                    onClick={() => navigateImage('next')}
                    size="lg"
                    variant="ghost"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 