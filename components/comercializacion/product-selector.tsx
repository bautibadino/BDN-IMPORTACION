'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Package, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { IVA_NAMES } from '@/lib/fiscal-utils'

interface Product {
  id: string
  name: string
  internalCode?: string
  finalPriceArs: number
  stock: number
  location?: string
  ivaType: string
  unit?: string
}

interface ProductSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  onProductSelect?: (product: Product) => void
  placeholder?: string
  disabled?: boolean
}

export function ProductSelector({
  value,
  onValueChange,
  onProductSelect,
  placeholder = "Seleccionar producto...",
  disabled = false
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const selectedProduct = products.find(product => product.id === value)

  useEffect(() => {
    fetchProducts()
  }, [search])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (productId: string) => {
    const product = products.find(p => p.id === productId)
    
    // Validar que el producto tenga stock
    if (!product || product.stock <= 0) {
      return // No permitir seleccionar productos sin stock
    }
    
    onValueChange(productId)
    if (onProductSelect) {
      onProductSelect(product)
    }
    setOpen(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedProduct ? (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="truncate">{selectedProduct.name}</span>
              {selectedProduct.internalCode && (
                <span className="text-xs text-gray-500">
                  ({selectedProduct.internalCode})
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              {placeholder}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar producto..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <div className="text-center py-4">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  No se encontraron productos
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => handleSelect(product.id)}
                  className={cn(
                    "flex items-center justify-between p-3",
                    product.stock <= 0 && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={product.stock <= 0}
                >
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{product.name}</span>
                      {product.internalCode && (
                        <Badge variant="outline" className="text-xs">
                          {product.internalCode}
                        </Badge>
                      )}
                      {product.stock <= 0 && (
                        <Badge variant="destructive" className="text-xs">
                          SIN STOCK
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="font-medium text-green-600">
                        {formatPrice(product.finalPriceArs)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {IVA_NAMES[product.ivaType as keyof typeof IVA_NAMES] || product.ivaType}
                      </Badge>
                      <span className={cn(
                        "font-medium",
                        product.stock > 10 ? "text-green-600" :
                        product.stock > 0 ? "text-orange-600" : "text-red-600"
                      )}>
                        Stock: {product.stock} {product.unit && `${product.unit}`}
                      </span>
                      {product.location && (
                        <span>📍 {product.location}</span>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 