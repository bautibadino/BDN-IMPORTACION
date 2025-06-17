import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (existingAdmin) {
      console.log('Ya existe un usuario administrador')
      return
    }

    // Crear el usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@bdnimportacion.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    })

    console.log('Usuario administrador creado exitosamente:')
    console.log(`Email: ${admin.email}`)
    console.log('Contraseña: admin123')
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña por defecto después del primer login')

  } catch (error) {
    console.error('Error al crear el usuario administrador:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin() 