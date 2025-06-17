"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { 
  getAuthorizationUrl, 
  exchangeCodeForTokens, 
  refreshAccessToken,
  isTokenExpired,
  calculateExpirationDate 
} from "@/lib/mercadolibre"
import prisma from "@/lib/prisma"
import type { MercadoLibreAuthResponse } from "@/lib/types"

/**
 * Inicia el proceso de autorización con MercadoLibre
 */
export async function startMercadoLibreAuth() {
  const url = getAuthorizationUrl()
  console.log('🔗 URL de autorización:', url)
  redirect(url)
}

/**
 * Maneja el callback de autorización de MercadoLibre
 */
export async function handleMercadoLibreCallback(code: string, userId?: string) {
  try {
    // Intercambiar código por tokens
    const authResponse = await exchangeCodeForTokens(code)
    
    // Calcular fecha de expiración
    const expiresAt = calculateExpirationDate(authResponse.expires_in)
    
    // Guardar o actualizar tokens en la base de datos
    await prisma.mercadoLibreToken.upsert({
      where: { userId: userId || 'default' },
      update: {
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        expiresAt: expiresAt,
      },
      create: {
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        expiresAt: expiresAt,
        userId: userId || 'default',
      },
    })
    
    return { 
      success: true, 
      message: "Autorización exitosa con MercadoLibre",
      userId: authResponse.user_id 
    }
  } catch (error) {
    console.error("Error handling ML callback:", error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Error desconocido" 
    }
  }
}

/**
 * Obtiene un token válido (renovándolo si es necesario)
 */
export async function getValidToken(userId?: string): Promise<string | null> {
  try {
    const tokenRecord = await prisma.mercadoLibreToken.findUnique({
      where: { userId: userId || 'default' }
    })
    
    if (!tokenRecord) {
      return null
    }
    
    // Si el token no ha expirado, devolverlo
    if (!isTokenExpired(tokenRecord.expiresAt)) {
      return tokenRecord.accessToken
    }
    
    // Si ha expirado, intentar renovarlo
    try {
      const authResponse = await refreshAccessToken(tokenRecord.refreshToken)
      const expiresAt = calculateExpirationDate(authResponse.expires_in)
      
      // Actualizar tokens en la base de datos
      await prisma.mercadoLibreToken.update({
        where: { id: tokenRecord.id },
        data: {
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          expiresAt: expiresAt,
        },
      })
      
      return authResponse.access_token
    } catch (refreshError) {
      console.error("Error refreshing token:", refreshError)
      // Si no se puede renovar, eliminar el token inválido
      await prisma.mercadoLibreToken.delete({
        where: { id: tokenRecord.id }
      })
      return null
    }
  } catch (error) {
    console.error("Error getting valid token:", error)
    return null
  }
}

/**
 * Verifica si hay una conexión válida con MercadoLibre (con auto-renovación)
 */
export async function checkMercadoLibreConnection(userId?: string) {
  try {
    const token = await getValidToken(userId)
    
    if (token) {
      // Verificar cuándo expira el token
      const tokenRecord = await prisma.mercadoLibreToken.findUnique({
        where: { userId: userId || 'default' }
      })
      
      const hoursUntilExpiry = tokenRecord 
        ? Math.round((tokenRecord.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
        : 0
      
      return {
        isConnected: true,
        hasValidToken: true,
        hoursUntilExpiry,
        message: hoursUntilExpiry > 1 
          ? `Conectado - Token válido por ${hoursUntilExpiry}h`
          : 'Conectado - Token renovado automáticamente'
      }
    }
    
    return {
      isConnected: false,
      hasValidToken: false,
      message: 'No conectado a MercadoLibre'
    }
  } catch (error) {
    console.error('Error verificando conexión:', error)
    return {
      isConnected: false,
      hasValidToken: false,
      message: 'Error verificando conexión'
    }
  }
}

/**
 * Desconecta de MercadoLibre eliminando los tokens
 */
export async function disconnectMercadoLibre(userId?: string) {
  try {
    await prisma.mercadoLibreToken.deleteMany({
      where: { userId: userId || 'default' }
    })
    
    revalidatePath('/comercializacion/mercadolibre')
    return { success: true, message: "Desconectado de MercadoLibre exitosamente" }
  } catch (error) {
    console.error("Error disconnecting from ML:", error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Error desconocido" 
    }
  }
}

/**
 * Función temporal para usar el código de autorización manualmente
 */
export async function exchangeCodeManually(code: string) {
  try {
    console.log('🔄 Intercambiando código por tokens:', code)
    
    const authResponse = await exchangeCodeForTokens(code)
    console.log('✅ Tokens obtenidos:', authResponse)
    
    // Guardar tokens
    const expirationDate = calculateExpirationDate(authResponse.expires_in)
    
    const savedToken = await prisma.mercadoLibreToken.upsert({
      where: { userId: 'default' },
      update: {
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        expiresAt: expirationDate,
      },
      create: {
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        expiresAt: expirationDate,
        userId: 'default',
      },
    })
    
    console.log('✅ Tokens guardados:', savedToken.id)
    
    return {
      success: true,
      message: 'Tokens guardados correctamente',
      tokenId: savedToken.id
    }
  } catch (error) {
    console.error('❌ Error intercambiando código:', error)
    return {
      success: false,
      message: 'Error intercambiando código: ' + (error instanceof Error ? error.message : 'Unknown error')
    }
  }
} 