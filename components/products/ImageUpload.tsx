"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Upload, 
  ImageIcon, 
  X, 
  Check,
  Loader2,
  CloudUpload,
  FileImage,
  Plus
} from "lucide-react"

interface ImageUploadProps {
  isOpen: boolean
  onClose: () => void
  onImagesUploaded: (urls: string[]) => void
  productName: string
  maxImages?: number
}

export default function ImageUpload({ 
  isOpen, 
  onClose, 
  onImagesUploaded, 
  productName,
  maxImages = 10 
}: ImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Función para subir imagen a Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    
    if (!cloudName) {
      throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME no está configurado')
    }

    const formData = new FormData()
    formData.append('file', file)
    
    // Usar el preset que acabamos de crear
    formData.append('upload_preset', 'products')
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Cloudinary error details:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          data: data
        })
        
        throw new Error(`Error ${response.status}: ${data.error?.message || data.message || 'Error al subir la imagen'}`)
      }
      
      return data.secure_url
    } catch (error) {
      console.error('Upload error completo:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error desconocido al subir la imagen')
    }
  }

  // Manejar selección de archivos
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`)
        return false
      }
      
      // Validar tamaño (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} es demasiado grande (máx. 10MB)`)
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    // Verificar límite de imágenes
    if (uploadedImages.length + validFiles.length > maxImages) {
      toast.error(`Solo puedes subir ${maxImages} imágenes en total`)
      return
    }

    // Subir cada archivo
    for (const file of validFiles) {
      const fileId = `${file.name}-${Date.now()}`
      setUploadingImages(prev => ({ ...prev, [fileId]: true }))
      
      try {
        const imageUrl = await uploadToCloudinary(file)
        setUploadedImages(prev => [...prev, imageUrl])
        toast.success(`${file.name} subida correctamente`)
      } catch (error) {
        console.error('Error uploading file:', error)
        toast.error(`Error al subir ${file.name}`)
      } finally {
        setUploadingImages(prev => {
          const newState = { ...prev }
          delete newState[fileId]
          return newState
        })
      }
    }
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadedImages.length, maxImages])

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Simular el evento de cambio del input
    const mockEvent = {
      target: { files: files }
    } as any
    
    await handleFileSelect(mockEvent)
  }

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove))
    toast.success("Imagen eliminada")
  }

  const handleSave = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Selecciona al menos una imagen")
      return
    }

    setIsUploading(true)
    try {
      await onImagesUploaded(uploadedImages)
      toast.success(`${uploadedImages.length} imagen${uploadedImages.length !== 1 ? 'es' : ''} guardada${uploadedImages.length !== 1 ? 's' : ''} correctamente`)
      setUploadedImages([])
      onClose()
    } catch (error) {
      console.error("Error saving images:", error)
      toast.error("Error al guardar las imágenes")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setUploadedImages([])
    setUploadingImages({})
    onClose()
  }

  const clearAllImages = () => {
    setUploadedImages([])
    setUploadingImages({})
    toast.success("Todas las imágenes eliminadas")
  }

  const isCurrentlyUploading = Object.keys(uploadingImages).length > 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CloudUpload className="h-5 w-5 text-purple-600" />
            </div>
            Subir Imágenes - {productName}
            <Badge variant="outline" className="ml-2">
              {uploadedImages.length}/{maxImages}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Zona de subida con drag & drop */}
          <div 
            className="border-2 border-dashed border-purple-300 rounded-lg p-8 hover:border-purple-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileImage className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Arrastra imágenes aquí o selecciona archivos
              </h3>
              <p className="text-gray-500 mb-4">
                Puedes subir hasta {maxImages - uploadedImages.length} imágenes más • JPG, PNG, GIF • Máx. 10MB cada una
              </p>
              
              {/* Input oculto */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadedImages.length >= maxImages || isCurrentlyUploading}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
              >
                {isCurrentlyUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Seleccionar Archivos
                  </>
                )}
              </Button>

              {isCurrentlyUploading && (
                <p className="text-sm text-gray-500 mt-2">
                  Subiendo {Object.keys(uploadingImages).length} archivo{Object.keys(uploadingImages).length !== 1 ? 's' : ''}...
                </p>
              )}
            </div>
          </div>

          {/* Preview de imágenes subidas */}
          {uploadedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-purple-600" />
                  Imágenes subidas ({uploadedImages.length})
                </h4>
                <Button
                  onClick={clearAllImages}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar todo
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-md hover:shadow-lg transition-shadow duration-200">
                      <img
                        src={imageUrl}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                        <Button
                          onClick={() => removeImage(index)}
                          size="sm"
                          variant="destructive"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-sm">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isUploading || isCurrentlyUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={uploadedImages.length === 0 || isUploading || isCurrentlyUploading}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Guardar {uploadedImages.length} Imagen{uploadedImages.length !== 1 ? 'es' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 