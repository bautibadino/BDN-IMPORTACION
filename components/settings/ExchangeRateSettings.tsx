"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { DollarSign, TrendingUp } from "lucide-react"
import { getUsdToArsRate, setUsdToArsRate, formatARS } from "@/lib/settings"

export default function ExchangeRateSettings() {
  const [rate, setRate] = useState<number>(1000)
  const [tempRate, setTempRate] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    const currentRate = getUsdToArsRate()
    setRate(currentRate)
    setTempRate(currentRate.toString())
  }, [])

  const handleSave = () => {
    const newRate = parseFloat(tempRate)
    
    if (isNaN(newRate) || newRate <= 0) {
      toast({
        title: "Error",
        description: "Ingresa un tipo de cambio válido",
        variant: "destructive"
      })
      return
    }

    setUsdToArsRate(newRate)
    setRate(newRate)
    
    toast({
      title: "Tipo de cambio actualizado",
      description: `USD/ARS: $${newRate.toLocaleString()}`,
    })
  }

  const handleReset = () => {
    setTempRate(rate.toString())
  }

  // Ejemplo de conversión
  const exampleUsd = 100
  const exampleArs = exampleUsd * parseFloat(tempRate || "0")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Tipo de Cambio USD/ARS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="exchange-rate">Tipo de Cambio Actual</Label>
          <div className="flex gap-2">
            <Input
              id="exchange-rate"
              type="number"
              min="0"
              step="0.01"
              placeholder="1000"
              value={tempRate}
              onChange={(e) => setTempRate(e.target.value)}
            />
            <Button onClick={handleSave} disabled={tempRate === rate.toString()}>
              Guardar
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Ejemplo de Conversión</span>
          </div>
          <p className="text-sm text-blue-700">
            USD ${exampleUsd} = {formatARS(exampleArs)}
          </p>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Este tipo de cambio se usa para convertir costos USD a ARS</p>
          <p>• Se aplica automáticamente en productos y precios finales</p>
          <p>• Actualízalo regularmente para mantener precios exactos</p>
        </div>
      </CardContent>
    </Card>
  )
} 