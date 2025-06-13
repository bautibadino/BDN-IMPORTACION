import { NextResponse } from 'next/server';
import { getDolarBlueRate } from '@/lib/currency';

export async function GET(request: Request) {
  try {
    // Verificar si se solicita un refresh forzado
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    console.log(`🔄 API Route: ${forceRefresh ? 'Refresh forzado' : 'Consulta normal'} de dólar blue`);
    
    const rates = await getDolarBlueRate(forceRefresh);
    
    return NextResponse.json(rates, {
      headers: {
        // Cache más largo para reducir llamadas
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // Cache por 1 hora
      },
    });
  } catch (error) {
    console.error('❌ Error in dolar-blue API route:', error);
    
    // Devolver valores por defecto en caso de error
    return NextResponse.json(
      {
        buy: 1170,
        sell: 1190,
        lastUpdate: new Date(),
      },
      { 
        status: 200, // Devolver 200 con valores por defecto
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache más corto para errores
        },
      }
    );
  }
} 