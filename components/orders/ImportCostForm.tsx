"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addImportCostAction } from "@/app/orders/actions"
import { getImportCostTypeName } from "@/lib/costs"
import type { ImportCostFormData } from "@/lib/types"

interface ImportCostFormProps {
  orderId: string
  onSuccess?: () => void
  onCancel?: () => void
}

const IMPORT_COST_TYPES = [
  "flete_internacional",
  "flete_local", 
  "aduana_impuestos",
  "seguro",
  "almacenaje",
  "despachante",
  "bancarios",
  "otros"
] as const

export default function ImportCostForm({ orderId, onSuccess, onCancel }: ImportCostFormProps) {
  const [formData, setFormData] = useState<ImportCostFormData>({
    orderId,
    type: "flete_internacional",
    amountUsd: 0,
    description: "",
    appliesTo: null
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validar que el monto sea positivo
      if (formData.amountUsd <= 0) {
        setError("El monto debe ser mayor a 0")
        return
      }

      const result = await addImportCostAction(formData)
      
      if (result.success) {
        // Resetear el formulario
        setFormData({
          orderId,
          type: "flete_internacional",
          amountUsd: 0,
          description: "",
          appliesTo: null
        })
        
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(result.message || "Error al agregar el costo")
      }
    } catch (err) {
      setError("Error inesperado al agregar el costo")
      console.error("Error en ImportCostForm:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof ImportCostFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Costo de Importación</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Costo *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de costo" />
              </SelectTrigger>
              <SelectContent>
                {IMPORT_COST_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {getImportCostTypeName(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountUsd">Monto en USD *</Label>
            <Input
              id="amountUsd"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.amountUsd || ""}
              onChange={(e) => handleInputChange("amountUsd", parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción opcional del costo..."
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appliesTo">Se aplica a</Label>
            <Select 
              value={formData.appliesTo || "todos"} 
              onValueChange={(value) => handleInputChange("appliesTo", value === "todos" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona a qué se aplica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los productos</SelectItem>
                <SelectItem value="manual">Asignación manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Agregando..." : "Agregar Costo"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 