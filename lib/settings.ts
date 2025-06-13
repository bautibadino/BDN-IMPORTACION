// Configuraciones del sistema
let USD_TO_ARS_RATE = 1000; // Valor por defecto

// Funciones para obtener y actualizar el tipo de cambio
export const getUsdToArsRate = (): number => {
  // Intentar obtener desde localStorage si está disponible
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('USD_TO_ARS_RATE');
    if (stored) {
      USD_TO_ARS_RATE = parseFloat(stored);
    }
  }
  return USD_TO_ARS_RATE;
};

export const setUsdToArsRate = (rate: number): void => {
  USD_TO_ARS_RATE = rate;
  // Guardar en localStorage si está disponible
  if (typeof window !== 'undefined') {
    localStorage.setItem('USD_TO_ARS_RATE', rate.toString());
  }
};

// Función para formatear valores en ARS
export const formatARS = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Función para convertir USD a ARS
export const convertUsdToArs = (usdAmount: number): number => {
  return usdAmount * getUsdToArsRate();
};

// Configuración por defecto
export const DEFAULT_MARKUP_PERCENTAGE = 30; 