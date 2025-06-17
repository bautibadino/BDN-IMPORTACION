"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Tag, Palette } from "lucide-react"
import { CreateCategoryDialog } from "./create-category-dialog"
import type { Category } from "@/lib/types"

interface CategorySelectorProps {
  selectedCategoryIds: string[]
  primaryCategoryId?: string
  onCategoriesChange: (categoryIds: string[], primaryCategoryId?: string) => void
  className?: string
}

export function CategorySelector({
  selectedCategoryIds,
  primaryCategoryId,
  onCategoriesChange,
  className
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create-defaults' }),
      })
      const data = await response.json()
      if (data.success) {
        await fetchCategories()
      }
    } catch (error) {
      console.error('Error creating default categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || category.type === selectedType
    return matchesSearch && matchesType
  })

  const groupedCategories = filteredCategories.reduce((groups, category) => {
    if (!groups[category.type]) {
      groups[category.type] = []
    }
    groups[category.type].push(category)
    return groups
  }, {} as Record<string, Category[]>)

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    let newSelectedIds = [...selectedCategoryIds]
    
    if (checked) {
      newSelectedIds.push(categoryId)
    } else {
      newSelectedIds = newSelectedIds.filter(id => id !== categoryId)
      // Si se desselecciona la categoría primaria, quitar la marca de primaria
      if (primaryCategoryId === categoryId) {
        onCategoriesChange(newSelectedIds, undefined)
        return
      }
    }
    
    onCategoriesChange(newSelectedIds, primaryCategoryId)
  }

  const handlePrimaryChange = (categoryId: string) => {
    onCategoriesChange(selectedCategoryIds, categoryId)
  }

  const selectedCategories = categories.filter(cat => selectedCategoryIds.includes(cat.id))

  const typeLabels = {
    marca: "Marcas",
    tipo: "Tipos",
    rubro: "Rubros", 
    material: "Materiales",
    color: "Colores",
    tamaño: "Tamaños",
    otros: "Otros"
  }

  const typeIcons = {
    marca: "🏷️",
    tipo: "📱",
    rubro: "📦",
    material: "🔧",
    color: "🎨",
    tamaño: "📏",
    otros: "⚙️"
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categorías
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Cargando categorías...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (categories.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categorías
          </CardTitle>
          <CardDescription>
            No hay categorías disponibles. Crear algunas categorías de ejemplo para comenzar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={createDefaultCategories} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Crear Categorías de Ejemplo
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Categorías del Producto
        </CardTitle>
        <CardDescription>
          Selecciona las categorías que mejor describan este producto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Categorías seleccionadas */}
        {selectedCategories.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categorías seleccionadas:</Label>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(category => (
                <Badge 
                  key={category.id} 
                  variant={primaryCategoryId === category.id ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => handlePrimaryChange(category.id)}
                >
                  {typeIcons[category.type]} {category.name}
                  {primaryCategoryId === category.id && " (Principal)"}
                </Badge>
              ))}
            </div>
            {selectedCategories.length > 1 && (
              <p className="text-xs text-muted-foreground">
                💡 Haz clic en una categoría para marcarla como principal
              </p>
            )}
          </div>
        )}

        {/* Búsqueda y filtros */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(typeLabels).map(([type, label]) => (
                  <SelectItem key={type} value={type}>
                    {typeIcons[type as keyof typeof typeIcons]} {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <CreateCategoryDialog 
              onCategoryCreated={() => fetchCategories()}
              trigger={
                <Button variant="outline" size="sm" className="gap-1 shrink-0">
                  <Plus className="h-4 w-4" />
                  Nueva
                </Button>
              }
            />
          </div>
        </div>

        {/* Lista de categorías agrupadas */}
        <ScrollArea className="h-[300px] w-full">
          <div className="space-y-4">
            {Object.entries(groupedCategories).map(([type, typeCategories]) => (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeIcons[type as keyof typeof typeIcons]}</span>
                  <Label className="text-sm font-medium text-muted-foreground">
                    {typeLabels[type as keyof typeof typeLabels]}
                  </Label>
                </div>
                <div className="grid grid-cols-1 gap-2 pl-6">
                  {typeCategories.map(category => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={category.id}
                        checked={selectedCategoryIds.includes(category.id)}
                        onCheckedChange={(checked) => 
                          handleCategoryToggle(category.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={category.id}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {category.name}
                      </Label>
                      {category.color && (
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {type !== Object.keys(groupedCategories)[Object.keys(groupedCategories).length - 1] && (
                  <Separator className="my-2" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {filteredCategories.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p>No se encontraron categorías con el filtro actual</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 