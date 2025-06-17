"use client" // Necesario para usePathname

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Package2, ShoppingCart, Truck, Users, TrendingUp, DollarSign, CreditCard, UserCheck, FileText } from "lucide-react"
import { cn } from "@/lib/utils" // Asegúrate que cn está en lib/utils
import { UserMenu } from "@/components/ui/user-menu"

export function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { 
      label: "Importación", 
      icon: TrendingUp,
      isSection: true,
      items: [
        { href: "/importacion/proveedores", label: "Proveedores", icon: Users },
        { href: "/importacion/leads", label: "Leads", icon: Package },
        { href: "/importacion/orders", label: "Importaciones", icon: ShoppingCart },
      ]
    },
    { 
      label: "Comercialización", 
      icon: Package2,
      isSection: true,
      items: [
        { href: "/comercializacion/productos", label: "Productos", icon: Truck },
        { href: "/comercializacion/mercadolibre", label: "Mercadolibre", icon: ShoppingCart, disabled: true },
        { href: "/comercializacion/ventas", label: "Ventas", icon: DollarSign },
        { href: "/comercializacion/pagos", label: "Pagos", icon: CreditCard },
        { href: "/comercializacion/notas-credito", label: "Notas de Crédito", icon: FileText },
      ]
    },
    // { href: "/settings", label: "Configuración", icon: Settings },
  ]

  const isPathActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const isSubPathActive = (mainHref: string) => {
    return pathname.startsWith(mainHref) && pathname !== mainHref
  }

  return (
    <div className="flex h-full max-h-screen flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center border-b border-border px-6 shrink-0">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Package2 className="h-6 w-6 text-primary" />
          <span>BDN Importación</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.isSection ? (
              // Sección de módulo
              <div>
                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
                <div className="ml-6 space-y-1">
                  {item.items?.map((subItem) => (
                    <Link
                      key={subItem.label}
                      href={subItem.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === subItem.href
                          ? "bg-muted text-primary"
                          : subItem.disabled
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      {...(subItem.disabled && { 
                        onClick: (e) => e.preventDefault(),
                        'aria-disabled': true 
                      })}
                    >
                      <subItem.icon className="h-4 w-4" />
                      {subItem.label}
                      {subItem.disabled && (
                        <span className="ml-auto text-xs text-muted-foreground/50">
                          Próximamente
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              // Enlace simple (Dashboard)
              <Link
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
      <div className="mt-auto border-t border-border p-4">
        <UserMenu />
      </div>
    </div>
  )
}
