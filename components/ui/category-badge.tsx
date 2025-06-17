import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  Tablet, 
  Headphones, 
  Zap, 
  Package, 
  Palette, 
  Ruler, 
  Tag,
  Star
} from "lucide-react"

interface CategoryBadgeProps {
  category: {
    id: string
    name: string
    type: 'marca' | 'tipo' | 'rubro' | 'material' | 'color' | 'tamaño' | 'otros'
    color?: string
    icon?: string
  }
  isPrimary?: boolean
  size?: 'sm' | 'default'
}

const getIconForType = (type: string, iconName?: string) => {
  if (iconName) {
    // Mapeo de iconos personalizados
    const iconMap: Record<string, any> = {
      smartphone: Smartphone,
      tablet: Tablet,
      headphones: Headphones,
      zap: Zap,
      package: Package,
      palette: Palette,
      ruler: Ruler,
      tag: Tag,
    }
    return iconMap[iconName] || Tag
  }

  // Iconos por defecto según el tipo
  const typeIconMap: Record<string, any> = {
    marca: Star,
    tipo: Package,
    rubro: Tag,
    material: Package,
    color: Palette,
    tamaño: Ruler,
    otros: Tag,
  }
  
  return typeIconMap[type] || Tag
}

const getColorForType = (type: string, customColor?: string) => {
  if (customColor) return customColor

  const typeColorMap: Record<string, string> = {
    marca: '#3B82F6', // blue
    tipo: '#10B981', // emerald
    rubro: '#8B5CF6', // violet
    material: '#F59E0B', // amber
    color: '#EF4444', // red
    tamaño: '#6B7280', // gray
    otros: '#6366F1', // indigo
  }
  
  return typeColorMap[type] || '#6B7280'
}

export function CategoryBadge({ category, isPrimary = false, size = 'default' }: CategoryBadgeProps) {
  const IconComponent = getIconForType(category.type, category.icon)
  const color = getColorForType(category.type, category.color)
  
  return (
    <Badge 
      variant={isPrimary ? "default" : "secondary"}
      className={`
        inline-flex items-center gap-1 
        ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'}
        ${isPrimary ? 'ring-2 ring-offset-1' : ''}
        transition-all duration-200 hover:scale-105
      `}
      style={{
        backgroundColor: isPrimary ? color : `${color}20`,
        color: isPrimary ? 'white' : color,
        borderColor: color,
        ...(isPrimary && { ringColor: `${color}40` })
      }}
    >
      <IconComponent className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {category.name}
      {isPrimary && <Star className="h-3 w-3 fill-current" />}
    </Badge>
  )
}

interface CategoryListProps {
  categories: Array<{
    category: {
      id: string
      name: string
      type: 'marca' | 'tipo' | 'rubro' | 'material' | 'color' | 'tamaño' | 'otros'
      color?: string
      icon?: string
    }
    isPrimary: boolean
  }>
  size?: 'sm' | 'default'
  maxVisible?: number
}

export function CategoryList({ categories, size = 'default', maxVisible = 3 }: CategoryListProps) {
  if (!categories || categories.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Sin categorías
      </Badge>
    )
  }

  // Ordenar para mostrar la categoría principal primero
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return 0
  })

  const visibleCategories = sortedCategories.slice(0, maxVisible)
  const hiddenCount = categories.length - maxVisible

  return (
    <div className="flex flex-wrap gap-1">
      {visibleCategories.map((item) => (
        <CategoryBadge
          key={item.category.id}
          category={item.category}
          isPrimary={item.isPrimary}
          size={size}
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="text-muted-foreground">
          +{hiddenCount} más
        </Badge>
      )}
    </div>
  )
} 