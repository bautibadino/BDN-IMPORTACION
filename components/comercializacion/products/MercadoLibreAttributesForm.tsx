'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Settings, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { 
  getRequiredAttributesAction,
  saveProductAttributesAction
} from '@/app/comercializacion/mercadolibre/sync-actions'

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

interface MercadoLibreAttributesFormProps {
  productId: string
  categoryId: string
  onAttributesSaved?: () => void
}

export default function MercadoLibreAttributesForm({ 
  productId, 
  categoryId, 
  onAttributesSaved 
}: MercadoLibreAttributesFormProps) {
  const [isPending, startTransition] = useTransition()
  const [attributes, setAttributes] = useState<MLAttribute[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar atributos al montar el componente
  React.useEffect(() => {
    if (categoryId && !isLoaded) {
      loadAttributes()
    }
  }, [categoryId, isLoaded])

  const loadAttributes = () => {
    startTransition(async () => {
      const result = await getRequiredAttributesAction(categoryId)
      if (result.success) {
        setAttributes(result.attributes)
        setIsLoaded(true)
        
        // Inicializar valores por defecto
        const defaultValues: Record<string, string> = {}
        result.attributes.forEach((attr: MLAttribute) => {
          if (attr.values && attr.values.length > 0) {
            defaultValues[attr.id] = attr.values[0].name
          }
        })
        setAttributeValues(defaultValues)
        
        toast.success(`${result.attributes.length} atributos cargados`)
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleAttributeChange = (attributeId: string, value: string) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }))
  }

  const handleSave = () => {
    // Verificar que todos los atributos requeridos estén completos
    const missingAttributes = attributes.filter(attr => 
      attr.required && !attributeValues[attr.id]?.trim()
    )

    if (missingAttributes.length > 0) {
      toast.error(`Completa estos campos: ${missingAttributes.map(attr => attr.name).join(', ')}`)
      return
    }

    startTransition(async () => {
      const result = await saveProductAttributesAction(productId, attributeValues)
      if (result.success) {
        toast.success(result.message)
        if (onAttributesSaved) onAttributesSaved()
      } else {
        toast.error(result.message)
      }
    })
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Atributos de MercadoLibre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Cargando atributos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Atributos de MercadoLibre
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-amber-700">
            Completa todos los campos requeridos para poder publicar en MercadoLibre
          </span>
        </div>

        <div className="grid gap-4">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="space-y-2">
              <Label htmlFor={attribute.id}>
                {attribute.name}
                {attribute.required && <span className="text-red-500 ml-1">*</span>}
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
                {attribute.required && ' | Requerido'}
              </div>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleSave}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            'Guardar Atributos'
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 