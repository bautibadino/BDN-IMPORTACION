"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  RefreshCw, 
  Clock,
  DollarSign,
  AlertCircle,
  Banknote,
  Calculator,
  Trash2,
  Timer,
  Shield,
  AlertTriangle
} from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"

interface DolarBlueDisplayProps {
  usdAmount?: number
  showConversion?: boolean
  className?: string
}

export function DolarBlueDisplay({ 
  usdAmount, 
  showConversion = false, 
  className 
}: DolarBlueDisplayProps) {
  const { 
    rates, 
    loading, 
    error, 
    lastUpdate, 
    cacheTimeRemaining, 
    isCircuitBreakerOpen,
    circuitBreakerTimeRemaining,
    refresh, 
    clearCache 
  } = useCurrency()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  const handleClearCache = () => {
    clearCache()
  }

  const formatTime = (date: Date | null) => {
    if (!date) return ''
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    }).format(date)
  }

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Expirado'
    const minutes = Math.floor(ms / (60 * 1000))
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
  }

  const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(amount)
  }

  return (
    <Card className={`w-full max-w-md border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-lg">
        <CardTitle className="flex items-center justify-between text-blue-900">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold">Dólar Blue</span>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isCircuitBreakerOpen}
                className="h-8 w-8 p-0 hover:bg-blue-200/50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCache}
              className="h-8 w-8 p-0 hover:bg-red-200/50 text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Alerta de Circuit Breaker */}
        {isCircuitBreakerOpen && (
          <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">API Temporalmente Bloqueada</span>
            </div>
            <p className="text-xs text-red-600">
              La API del dólar está experimentando problemas. Se reactivará en {formatTimeRemaining(circuitBreakerTimeRemaining)}.
            </p>
          </div>
        )}

        {loading && !rates ? (
          <div className="space-y-3">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
          </div>
        ) : error && !rates ? (
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : rates ? (
          <div className="space-y-4">
            {/* Cotización actual */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-1">Compra</p>
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(rates.buy, 'ARS')}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 font-medium mb-1">Venta</p>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(rates.sell, 'ARS')}
                </p>
              </div>
            </div>

            {/* Conversión específica */}
            {showConversion && usdAmount && usdAmount > 0 && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                      {formatCurrency(usdAmount, 'USD')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-purple-600">Equivale a</p>
                    <p className="text-lg font-bold text-purple-700">
                      {formatCurrency(usdAmount * rates.sell, 'ARS')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Información de actualización */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Última actualización: {lastUpdate ? formatTime(lastUpdate) : 'No disponible'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isCircuitBreakerOpen ? (
                  <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                    <Shield className="h-3 w-3 mr-1" />
                    Bloqueado
                  </Badge>
                ) : cacheTimeRemaining > 0 ? (
                  <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                    <Banknote className="h-3 w-3 mr-1" />
                    Cache ({formatTimeRemaining(cacheTimeRemaining)})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
                    <Banknote className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                )}
              </div>
            </div>

            {/* Nota informativa */}
            <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="flex items-start gap-2">
                <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-500" />
                Los precios se actualizan automáticamente cada hora usando la cotización del dólar blue oficial de{' '}
                <a 
                  href="https://dolarapi.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  DolarAPI.com
                </a>
                {isCircuitBreakerOpen && (
                  <span className="block mt-1 text-amber-600">
                    ⚠️ Actualmente usando datos en cache debido a problemas con la API externa.
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
} 