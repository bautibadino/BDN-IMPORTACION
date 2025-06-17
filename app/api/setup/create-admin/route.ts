import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

// Token de seguridad temporal - cámbialo por algo único
const SETUP_TOKEN = 'setup-admin-token-2024'

export async function POST(request: NextRequest) {
  try {
    // Verificar token de seguridad
    const { token, email, password, name } = await request.json()
    
    if (token !== SETUP_TOKEN) {
      return NextResponse.json(
        { error: 'Token de setup inválido' },
        { status: 401 }
      )
    }

    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Ya existe un usuario administrador' },
        { status: 400 }
      )
    }

    // Crear el usuario administrador
    const hashedPassword = await bcrypt.hash(password || 'admin123', 12)

    const admin = await prisma.user.create({
      data: {
        name: name || 'Administrador',
        email: email || 'admin@bdnimportacion.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    })

    // No devolver la contraseña
    const { password: _, ...adminWithoutPassword } = admin

    return NextResponse.json(
      { 
        message: 'Usuario administrador creado exitosamente', 
        user: adminWithoutPassword 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear usuario administrador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 