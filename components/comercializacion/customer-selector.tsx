'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react'
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
import Link from 'next/link'

interface Customer {
  id: string
  businessName: string
  contactName?: string
  taxId?: string
  customerType: string
  currentBalance?: number
}

interface CustomerSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  onCustomerSelect?: (customer: Customer) => void
  placeholder?: string
  disabled?: boolean
}

export function CustomerSelector({
  value,
  onValueChange,
  onCustomerSelect,
  placeholder = "Seleccionar cliente...",
  disabled = false
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const selectedCustomer = customers.find(customer => customer.id === value)

  useEffect(() => {
    fetchCustomers()
  }, [search])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      params.append('isActive', 'true')

      const response = await fetch(`/api/customers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (customerId: string) => {
    onValueChange(customerId)
    const customer = customers.find(c => c.id === customerId)
    if (customer && onCustomerSelect) {
      onCustomerSelect(customer)
    }
    setOpen(false)
  }

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'responsable_inscripto':
        return 'bg-blue-100 text-blue-800'
      case 'monotributo':
        return 'bg-green-100 text-green-800'
      case 'exento':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCustomerTypeLabel = (type: string) => {
    switch (type) {
      case 'responsable_inscripto':
        return 'Resp. Inscripto'
      case 'monotributo':
        return 'Monotributo'
      case 'consumidor_final':
        return 'Cons. Final'
      case 'exento':
        return 'Exento'
      default:
        return type
    }
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
          {selectedCustomer ? (
            <div className="flex items-center gap-2">
              <span className="truncate">{selectedCustomer.businessName}</span>
              {selectedCustomer.taxId && (
                <span className="text-xs text-gray-500">
                  {selectedCustomer.taxId}
                </span>
              )}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar cliente..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">
                  No se encontraron clientes
                </p>
                <Link href="/comercializacion/ventas/clientes/nuevo">
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear nuevo cliente
                  </Button>
                </Link>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={() => handleSelect(customer.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{customer.businessName}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          getCustomerTypeColor(customer.customerType)
                        )}
                      >
                        {getCustomerTypeLabel(customer.customerType)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {customer.contactName && (
                        <span>{customer.contactName}</span>
                      )}
                      {customer.taxId && (
                        <span>CUIT: {customer.taxId}</span>
                      )}
                      {customer.currentBalance !== undefined && (
                        <span
                          className={cn(
                            "font-medium",
                            customer.currentBalance > 0
                              ? "text-red-600"
                              : customer.currentBalance < 0
                              ? "text-green-600"
                              : "text-gray-600"
                          )}
                        >
                          Saldo: ${customer.currentBalance.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === customer.id ? "opacity-100" : "opacity-0"
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