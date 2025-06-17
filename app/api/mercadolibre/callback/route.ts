import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { handleMercadoLibreCallback } from '@/app/comercializacion/mercadolibre/actions'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    // Si hay un error en la autorización
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Error desconocido'
      console.error('ML Auth Error:', error, errorDescription)
      return NextResponse.redirect(
        new URL('/comercializacion/mercadolibre?error=' + encodeURIComponent(errorDescription), request.url)
      )
    }
    
    // Si no hay código, error
    if (!code) {
      return NextResponse.redirect(
        new URL('/comercializacion/mercadolibre?error=No se recibió código de autorización', request.url)
      )
    }
    
    // Procesar el callback
    const result = await handleMercadoLibreCallback(code)
    
    if (result.success) {
      return NextResponse.redirect(
        new URL('/comercializacion/mercadolibre?success=' + encodeURIComponent(result.message), request.url)
      )
    } else {
      return NextResponse.redirect(
        new URL('/comercializacion/mercadolibre?error=' + encodeURIComponent(result.message), request.url)
      )
    }
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      new URL('/comercializacion/mercadolibre?error=Error procesando autorización', request.url)
    )
  }
} 