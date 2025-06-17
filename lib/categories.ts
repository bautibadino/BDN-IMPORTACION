import prisma from "@/lib/prisma"
import type { Category, CategoryFormData, ProductCategoryFormData } from "@/lib/types"

// Función para generar slug único
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9\s-]/g, "") // Quitar caracteres especiales
    .trim()
    .replace(/\s+/g, "-") // Reemplazar espacios con guiones
    .replace(/-+/g, "-") // Evitar guiones múltiples
}

// Función para generar slug único verificando duplicados
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  let baseSlug = generateSlug(name)
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug }
    })

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

// --- CRUD de Categorías ---

export async function getCategories(includeInactive = false) {
  const categories = await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      parent: true,
      children: {
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' }
      },
      _count: {
        select: {
          productCategories: true
        }
      }
    },
    orderBy: [
      { type: 'asc' },
      { name: 'asc' }
    ]
  })

  return categories.map(category => ({
    ...category,
    productCount: category._count.productCategories
  }))
}

export async function getCategoriesByType(type: Category['type'], includeInactive = false) {
  return await prisma.category.findMany({
    where: {
      type,
      ...(includeInactive ? {} : { isActive: true })
    },
    include: {
      parent: true,
      children: {
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function getCategoryById(id: string) {
  return await prisma.category.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        orderBy: { name: 'asc' }
      },
      productCategories: {
        include: {
          product: {
            include: {
              productLead: true
            }
          }
        }
      }
    }
  })
}

export async function getCategoryBySlug(slug: string) {
  return await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }
    }
  })
}

export async function addCategory(data: CategoryFormData) {
  const slug = await generateUniqueSlug(data.name)

  return await prisma.category.create({
    data: {
      ...data,
      slug,
    },
    include: {
      parent: true,
      children: true
    }
  })
}

export async function updateCategory(id: string, data: Partial<CategoryFormData>) {
  const updateData: any = { ...data }

  // Si se actualiza el nombre, regenerar el slug
  if (data.name) {
    updateData.slug = await generateUniqueSlug(data.name, id)
  }

  return await prisma.category.update({
    where: { id },
    data: updateData,
    include: {
      parent: true,
      children: true
    }
  })
}

export async function deleteCategory(id: string) {
  // Verificar si tiene productos asociados
  const productCount = await prisma.productCategory.count({
    where: { categoryId: id }
  })

  if (productCount > 0) {
    throw new Error(`No se puede eliminar la categoría porque tiene ${productCount} productos asociados.`)
  }

  // Verificar si tiene subcategorías
  const childrenCount = await prisma.category.count({
    where: { parentId: id }
  })

  if (childrenCount > 0) {
    throw new Error(`No se puede eliminar la categoría porque tiene ${childrenCount} subcategorías.`)
  }

  return await prisma.category.delete({
    where: { id }
  })
}

export async function toggleCategoryStatus(id: string) {
  const category = await prisma.category.findUnique({
    where: { id }
  })

  if (!category) {
    throw new Error("Categoría no encontrada.")
  }

  return await prisma.category.update({
    where: { id },
    data: {
      isActive: !category.isActive
    }
  })
}

// --- Gestión de Categorías de Productos ---

export async function getProductCategories(productId: string) {
  return await prisma.productCategory.findMany({
    where: { productId },
    include: {
      category: true
    },
    orderBy: [
      { isPrimary: 'desc' },
      { category: { name: 'asc' } }
    ]
  })
}

export async function assignCategoriesToProduct(data: ProductCategoryFormData) {
  const { productId, categoryIds, primaryCategoryId } = data

  // Eliminar categorías existentes
  await prisma.productCategory.deleteMany({
    where: { productId }
  })

  // Crear nuevas asignaciones
  const assignments = categoryIds.map(categoryId => ({
    productId,
    categoryId,
    isPrimary: categoryId === primaryCategoryId
  }))

  return await prisma.productCategory.createMany({
    data: assignments
  })
}

export async function removeProductFromCategory(productId: string, categoryId: string) {
  return await prisma.productCategory.delete({
    where: {
      productId_categoryId: {
        productId,
        categoryId
      }
    }
  })
}

export async function setPrimaryCategory(productId: string, categoryId: string) {
  // Quitar la marca primary de todas las categorías del producto
  await prisma.productCategory.updateMany({
    where: { productId },
    data: { isPrimary: false }
  })

  // Marcar la categoría especificada como primary
  return await prisma.productCategory.update({
    where: {
      productId_categoryId: {
        productId,
        categoryId
      }
    },
    data: { isPrimary: true }
  })
}

// --- Utilidades ---

export async function getCategoryTree(type?: Category['type']) {
  const where = type ? { type, parentId: null } : { parentId: null }

  return await prisma.category.findMany({
    where: {
      ...where,
      isActive: true
    },
    include: {
      children: {
        where: { isActive: true },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function getCategoryStats() {
  const stats = await prisma.category.groupBy({
    by: ['type'],
    _count: {
      id: true
    },
    where: {
      isActive: true
    }
  })

  const totalProducts = await prisma.productCategory.count()

  return {
    categoryStats: stats.map(stat => ({
      type: stat.type,
      count: stat._count.id
    })),
    totalCategories: stats.reduce((sum, stat) => sum + stat._count.id, 0),
    totalProducts
  }
}

// Función para crear categorías de ejemplo
export async function createDefaultCategories() {
  const defaultCategories = [
    // Marcas
    { name: "Samsung", type: "marca" as const, color: "#1f77d0" },
    { name: "Apple", type: "marca" as const, color: "#000000" },
    { name: "Xiaomi", type: "marca" as const, color: "#ff6900" },
    { name: "Huawei", type: "marca" as const, color: "#ff0000" },
    
    // Tipos
    { name: "Smartphones", type: "tipo" as const, color: "#4caf50" },
    { name: "Tablets", type: "tipo" as const, color: "#2196f3" },
    { name: "Auriculares", type: "tipo" as const, color: "#9c27b0" },
    { name: "Cargadores", type: "tipo" as const, color: "#ff9800" },
    
    // Rubros
    { name: "Electrónicos", type: "rubro" as const, color: "#607d8b" },
    { name: "Accesorios", type: "rubro" as const, color: "#795548" },
    { name: "Audio", type: "rubro" as const, color: "#e91e63" },
    
    // Materiales
    { name: "Plástico", type: "material" as const, color: "#9e9e9e" },
    { name: "Metal", type: "material" as const, color: "#424242" },
    { name: "Vidrio", type: "material" as const, color: "#03a9f4" },
  ]

  const createdCategories = []

  for (const categoryData of defaultCategories) {
    try {
      const existing = await getCategoryBySlug(generateSlug(categoryData.name))
      if (!existing) {
        const category = await addCategory(categoryData)
        createdCategories.push(category)
      }
    } catch (error) {
      console.error(`Error creando categoría ${categoryData.name}:`, error)
    }
  }

  return createdCategories
} 