import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Token de seguridad
const SETUP_TOKEN = 'setup-admin-token-2024'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (token !== SETUP_TOKEN) {
      return NextResponse.json(
        { error: 'Token de setup inválido' },
        { status: 401 }
      )
    }

    // Crear una instancia de Prisma para sincronización
    const prisma = new PrismaClient()

    try {
      // Intentar crear las tablas ejecutando una consulta que forzará la creación
      // Como no podemos ejecutar migrations directamente, vamos a verificar/crear manualmente
      
      // Verificar si la tabla existe intentando hacer una consulta
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT,
          "email" TEXT NOT NULL,
          "email_verified" DATETIME,
          "password" TEXT,
          "image" TEXT,
          "role" TEXT NOT NULL DEFAULT 'user',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `

      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
      `

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "accounts" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "user_id" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "provider" TEXT NOT NULL,
          "provider_account_id" TEXT NOT NULL,
          "refresh_token" TEXT,
          "access_token" TEXT,
          "expires_at" INTEGER,
          "token_type" TEXT,
          "scope" TEXT,
          "id_token" TEXT,
          "session_state" TEXT,
          CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "session_token" TEXT NOT NULL,
          "user_id" TEXT NOT NULL,
          "expires" DATETIME NOT NULL,
          CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `

      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "sessions_session_token_key" ON "sessions"("session_token");
      `

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "verificationtokens" (
          "identifier" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expires" DATETIME NOT NULL
        );
      `

      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");
      `

      return NextResponse.json(
        { message: 'Base de datos sincronizada exitosamente' },
        { status: 200 }
      )
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('Error al sincronizar base de datos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    )
  }
} 