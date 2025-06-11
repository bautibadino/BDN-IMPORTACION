"use client" // Necesario para usePathname

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Package2, ShoppingCart, Truck, Users } from "lucide-react"
import { cn } from "@/lib/utils" // Asegúrate que cn está en lib/utils

export function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/suppliers", label: "Proveedores", icon: Users },
    { href: "/leads", label: "Leads de Producto", icon: Package },
    { href: "/orders", label: "Pedidos", icon: ShoppingCart },
    { href: "/products", label: "Productos", icon: Truck },
    // { href: "/documents", label: "Documentos", icon: FileText }, // Podría ser una sección global o por pedido
    // { href: "/settings", label: "Configuración", icon: Settings },
  ]

  return (
    <div className="flex h-full max-h-screen flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center border-b border-border px-6 shrink-0">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Package2 className="h-6 w-6 text-primary" />
          <span>ImportApp</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-muted text-primary" // Estilo para el item activo
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      {/* Podrías añadir un pie de sidebar con info de usuario o un toggle de tema si lo implementas */}
    </div>
  )
}
