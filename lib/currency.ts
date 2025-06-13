export interface DolarBlueResponse {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export interface CurrencyRates {
  buy: number;
  sell: number;
  lastUpdate: Date;
}

// Cache para evitar llamadas frecuentes a la API
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos
const CACHE_KEY = 'dolar_blue_cache';
const API_TIMEOUT = 30000; // 30 segundos de timeout (más generoso)
const MAX_RETRIES = 1; // Solo 1 reintento

// Circuit Breaker para evitar llamadas excesivas cuando la API falla
const CIRCUIT_BREAKER_KEY = 'dolar_blue_circuit_breaker';
const CIRCUIT_BREAKER_THRESHOLD = 5; // Más tolerante: 5 fallos consecutivos
const CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutos

// Variable global para evitar múltiples llamadas simultáneas
let isCurrentlyFetching = false;
let currentFetchPromise: Promise<CurrencyRates> | null = null;

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

function getCircuitBreakerState(): CircuitBreakerState {
  if (typeof window === 'undefined') return { failures: 0, lastFailure: 0, isOpen: false };
  
  try {
    const stored = localStorage.getItem(CIRCUIT_BREAKER_KEY);
    if (!stored) return { failures: 0, lastFailure: 0, isOpen: false };
    
    const state = JSON.parse(stored);
    const now = Date.now();
    
    // Si el circuit breaker está abierto pero ha pasado el timeout, cerrarlo
    if (state.isOpen && (now - state.lastFailure) > CIRCUIT_BREAKER_TIMEOUT) {
      return { failures: 0, lastFailure: 0, isOpen: false };
    }
    
    return state;
  } catch (error) {
    console.error('Error reading circuit breaker state:', error);
    return { failures: 0, lastFailure: 0, isOpen: false };
  }
}

function updateCircuitBreakerState(state: CircuitBreakerState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CIRCUIT_BREAKER_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving circuit breaker state:', error);
  }
}

function recordFailure(): void {
  const state = getCircuitBreakerState();
  state.failures += 1;
  state.lastFailure = Date.now();
  state.isOpen = state.failures >= CIRCUIT_BREAKER_THRESHOLD;
  
  updateCircuitBreakerState(state);
  
  if (state.isOpen) {
    console.warn(`🚫 Circuit breaker ABIERTO: API bloqueada por ${CIRCUIT_BREAKER_TIMEOUT / 60000} minutos después de ${state.failures} fallos`);
  }
}

function recordSuccess(): void {
  updateCircuitBreakerState({ failures: 0, lastFailure: 0, isOpen: false });
}

// Función simplificada para hacer fetch con timeout
function fetchWithTimeout(url: string, timeout = API_TIMEOUT): Promise<Response> {
  return Promise.race([
    fetch(url), // Simple fetch sin headers complicados
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

// Función simplificada para hacer retry de la llamada a la API
async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  let lastError: Error;
  
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`🌐 Intentando conectar a la API (${i + 1}/${retries + 1})...`);
      const response = await fetchWithTimeout(url);
      
      if (response.ok) {
        console.log('✅ Respuesta exitosa de la API');
        return response;
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i < retries) {
        console.log(`🔄 Reintentando en 2 segundos... (${lastError.message})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos entre reintentos
      }
    }
  }
  
  throw lastError!;
}

// Función para obtener datos del localStorage
function getCachedData(): CurrencyRates | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const lastUpdate = new Date(data.lastUpdate);
    const now = new Date();
    
    // Verificar si el cache sigue siendo válido (menos de 1 hora)
    if (now.getTime() - lastUpdate.getTime() < CACHE_DURATION) {
      return {
        buy: data.buy,
        sell: data.sell,
        lastUpdate: lastUpdate
      };
    }
    
    // Cache expirado
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading currency cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

// Función para guardar datos en localStorage
function setCachedData(rates: CurrencyRates): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      buy: rates.buy,
      sell: rates.sell,
      lastUpdate: rates.lastUpdate.toISOString()
    }));
  } catch (error) {
    console.error('Error saving currency cache:', error);
  }
}

export async function getDolarBlueRate(forceRefresh = false): Promise<CurrencyRates> {
  // Verificar circuit breaker
  const circuitState = getCircuitBreakerState();
  if (circuitState.isOpen && !forceRefresh) {
    console.log('🚫 Circuit breaker abierto, usando fallback');
    
    // Intentar devolver cache expirado
    if (typeof window !== 'undefined') {
      try {
        const cachedFallback = localStorage.getItem(CACHE_KEY);
        if (cachedFallback) {
          const data = JSON.parse(cachedFallback);
          console.log('⚠️ Dólar blue: Usando cache por circuit breaker');
          return {
            buy: data.buy,
            sell: data.sell,
            lastUpdate: new Date(data.lastUpdate)
          };
        }
      } catch (cacheError) {
        console.error('Error reading fallback cache:', cacheError);
      }
    }
    
    // Si no hay cache, devolver valores por defecto
    console.log('🔄 Dólar blue: Usando valores por defecto (circuit breaker)');
    return {
      buy: 1170,
      sell: 1190,
      lastUpdate: new Date()
    };
  }

  // Si no es refresh forzado, intentar obtener del cache
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached) {
      console.log('📊 Dólar blue: Usando datos de cache');
      return cached;
    }
  }

  // Si ya hay una llamada en proceso, esperar a que termine
  if (isCurrentlyFetching && currentFetchPromise) {
    console.log('⏳ Dólar blue: Esperando llamada en progreso...');
    return currentFetchPromise;
  }

  // Marcar que estamos haciendo una llamada
  isCurrentlyFetching = true;
  
  currentFetchPromise = (async (): Promise<CurrencyRates> => {
    try {
      console.log('🌐 Dólar blue: Consultando dolarapi.com...');
      
      // Simple fetch request como muestra el usuario
      const response = await fetchWithRetry('https://dolarapi.com/v1/dolares/blue');
      
      const data: DolarBlueResponse = await response.json();
      
      // Validar que los datos sean válidos
      if (!data.compra || !data.venta || typeof data.compra !== 'number' || typeof data.venta !== 'number') {
        throw new Error('Invalid data format received from API');
      }
      
      const rates: CurrencyRates = {
        buy: data.compra,
        sell: data.venta,
        lastUpdate: new Date(data.fechaActualizacion || new Date())
      };
      
      // Guardar en cache
      setCachedData(rates);
      
      // Marcar como éxito en el circuit breaker
      recordSuccess();
      
      console.log('✅ Dólar blue: Datos actualizados exitosamente');
      return rates;
      
    } catch (error) {
      console.error('❌ Error consultando dolarapi.com:', error);
      
      // Registrar fallo en circuit breaker
      recordFailure();
      
      // Si hay error, intentar devolver cache aunque esté expirado (fallback)
      if (typeof window !== 'undefined') {
        try {
          const cachedFallback = localStorage.getItem(CACHE_KEY);
          if (cachedFallback) {
            const data = JSON.parse(cachedFallback);
            console.log('⚠️ Dólar blue: Usando cache expirado debido a error');
            return {
              buy: data.buy,
              sell: data.sell,
              lastUpdate: new Date(data.lastUpdate)
            };
          }
        } catch (cacheError) {
          console.error('Error reading fallback cache:', cacheError);
        }
      }
      
      // Si no hay cache, devolver valores por defecto
      console.log('🔄 Dólar blue: Usando valores por defecto');
      return {
        buy: 1170,
        sell: 1190,
        lastUpdate: new Date()
      };
    } finally {
      // Resetear estado
      isCurrentlyFetching = false;
      currentFetchPromise = null;
    }
  })();

  return currentFetchPromise;
}

// Función para obtener solo el precio de venta (el que usamos para conversiones)
export async function getDolarBlueSellRate(forceRefresh = false): Promise<number> {
  const rates = await getDolarBlueRate(forceRefresh);
  return rates.sell;
}

// Función para convertir USD a ARS usando el dólar blue
export async function convertUsdToArs(usdAmount: number, forceRefresh = false): Promise<number> {
  const rate = await getDolarBlueSellRate(forceRefresh);
  return usdAmount * rate;
}

// Función para limpiar cache manualmente
export function clearCurrencyCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CIRCUIT_BREAKER_KEY); // También limpiar circuit breaker
    console.log('🗑️ Cache del dólar blue y circuit breaker limpiados');
  }
}

// Función para verificar si el cache es válido
export function isCacheValid(): boolean {
  return getCachedData() !== null;
}

// Función para obtener tiempo restante del cache
export function getCacheTimeRemaining(): number {
  const cached = getCachedData();
  if (!cached) return 0;
  
  const now = new Date();
  const remaining = CACHE_DURATION - (now.getTime() - cached.lastUpdate.getTime());
  return Math.max(0, remaining);
}

// Función para verificar el estado del circuit breaker
export function getCircuitBreakerInfo(): { isOpen: boolean; failures: number; timeRemaining: number } {
  const state = getCircuitBreakerState();
  const timeRemaining = state.isOpen ? Math.max(0, CIRCUIT_BREAKER_TIMEOUT - (Date.now() - state.lastFailure)) : 0;
  
  return {
    isOpen: state.isOpen,
    failures: state.failures,
    timeRemaining
  };
}

// Función para formatear moneda ARS
export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Función para formatear moneda USD
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
} 