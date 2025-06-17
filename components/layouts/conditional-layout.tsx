"use client"

import { usePathname } from "next/navigation"
import { AuthLayout } from "./auth-layout"
import { MainLayout } from "./main-layout"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Rutas que usan el layout de autenticación (sin sidebar)
  const authRoutes = ['/auth/login', '/auth/register']
  const isAuthRoute = authRoutes.includes(pathname)

  if (isAuthRoute) {
    return <AuthLayout>{children}</AuthLayout>
  }

  return <MainLayout>{children}</MainLayout>
} 