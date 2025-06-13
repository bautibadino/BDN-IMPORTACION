"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { getDolarBlueRate, getCacheTimeRemaining, clearCurrencyCache, getCircuitBreakerInfo } from '@/lib/currency';
import type { CurrencyRates } from '@/lib/currency';

interface CurrencyContextType {
  rates: CurrencyRates | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  cacheTimeRemaining: number;
  isCircuitBreakerOpen: boolean;
  circuitBreakerTimeRemaining: number;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [cacheTimeRemaining, setCacheTimeRemaining] = useState(0);
  const [isCircuitBreakerOpen, setIsCircuitBreakerOpen] = useState(false);
  const [circuitBreakerTimeRemaining, setCircuitBreakerTimeRemaining] = useState(0);
  
  // Usar useRef para evitar dependencias circulares
  const fetchRatesRef = useRef<((forceRefresh?: boolean) => Promise<void>) | null>(null);

  const updateCacheTimeRemaining = useCallback(() => {
    const remaining = getCacheTimeRemaining();
    setCacheTimeRemaining(remaining);
    
    // También actualizar estado del circuit breaker
    const circuitInfo = getCircuitBreakerInfo();
    setIsCircuitBreakerOpen(circuitInfo.isOpen);
    setCircuitBreakerTimeRemaining(circuitInfo.timeRemaining);
  }, []);

  // Definir fetchRates sin dependencias problemáticas
  const fetchRates = useCallback(async (forceRefresh = false): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getDolarBlueRate(forceRefresh);
      setRates(data);
      setLastUpdate(new Date());
      
      // Actualizar cache time remaining directamente
      const remaining = getCacheTimeRemaining();
      setCacheTimeRemaining(remaining);
      
      // También actualizar estado del circuit breaker
      const circuitInfo = getCircuitBreakerInfo();
      setIsCircuitBreakerOpen(circuitInfo.isOpen);
      setCircuitBreakerTimeRemaining(circuitInfo.timeRemaining);
      
    } catch (err) {
      console.error('Error in CurrencyContext:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      // Actualizar estado del circuit breaker después del error
      const circuitInfo = getCircuitBreakerInfo();
      setIsCircuitBreakerOpen(circuitInfo.isOpen);
      setCircuitBreakerTimeRemaining(circuitInfo.timeRemaining);
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias para evitar ciclos
  
  // Asignar a la ref
  fetchRatesRef.current = fetchRates;

  const clearCache = useCallback(() => {
    clearCurrencyCache();
    setCacheTimeRemaining(0);
    setIsCircuitBreakerOpen(false);
    setCircuitBreakerTimeRemaining(0);
    // Refrescar datos después de limpiar cache
    if (fetchRatesRef.current) {
      fetchRatesRef.current(true);
    }
  }, []);

  // Cargar datos iniciales - solo una vez
  useEffect(() => {
    fetchRates();
  }, []); // Dependencias vacías para evitar bucle

  // Actualizar tiempo restante cada minuto
  useEffect(() => {
    const interval = setInterval(updateCacheTimeRemaining, 60 * 1000); // cada minuto
    return () => clearInterval(interval);
  }, [updateCacheTimeRemaining]);

  // Auto refresh solo cuando el cache expire Y el circuit breaker esté cerrado
  useEffect(() => {
    // NO hacer auto-refresh si:
    // 1. El circuit breaker está abierto
    // 2. Estamos cargando
    // 3. El cache aún es válido
    if (isCircuitBreakerOpen || loading || cacheTimeRemaining > 0 || !rates) {
      return;
    }

    // Solo hacer auto-refresh si el cache expiró y el circuit breaker está cerrado
    const timeout = setTimeout(async () => {
      try {
        console.log('🔄 Auto-refresh activado (cache expirado, circuit breaker cerrado)');
        const data = await getDolarBlueRate(false);
        setRates(data);
        setLastUpdate(new Date());
        const remaining = getCacheTimeRemaining();
        setCacheTimeRemaining(remaining);
        
        // Actualizar estado del circuit breaker
        const circuitInfo = getCircuitBreakerInfo();
        setIsCircuitBreakerOpen(circuitInfo.isOpen);
        setCircuitBreakerTimeRemaining(circuitInfo.timeRemaining);
      } catch (err) {
        console.error('Error in auto-refresh:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        
        // Actualizar estado del circuit breaker después del error
        const circuitInfo = getCircuitBreakerInfo();
        setIsCircuitBreakerOpen(circuitInfo.isOpen);
        setCircuitBreakerTimeRemaining(circuitInfo.timeRemaining);
      }
    }, 5000); // 5 segundos de delay para auto-refresh

    return () => clearTimeout(timeout);
  }, [cacheTimeRemaining, rates, loading, isCircuitBreakerOpen]);

  const value: CurrencyContextType = {
    rates,
    loading,
    error,
    lastUpdate,
    cacheTimeRemaining,
    isCircuitBreakerOpen,
    circuitBreakerTimeRemaining,
    refresh: () => fetchRates(true),
    clearCache
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
} 