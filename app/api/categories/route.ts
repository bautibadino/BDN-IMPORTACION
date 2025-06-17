import { NextResponse } from 'next/server'
import { createDefaultCategories, getCategories } from '@/lib/categories'

export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'create-defaults') {
      const categories = await createDefaultCategories()
      return NextResponse.json({ 
        success: true, 
        message: `${categories.length} categorías creadas exitosamente`,
        categories 
      })
    }
    
    if (action === 'create-category') {
      const { addCategory } = await import('@/lib/categories')
      const { name, type, description, color, icon, parentId } = body
      
      if (!name || !type) {
        return NextResponse.json(
          { error: 'Nombre y tipo son requeridos' },
          { status: 400 }
        )
      }
      
      const category = await addCategory({
        name,
        type,
        description,
        color,
        icon,
        parentId
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Categoría creada exitosamente',
        category 
      })
    }
    
    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in POST /api/categories:', error)
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 }
    )
  }
} 