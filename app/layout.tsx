import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/app/components/sidebar" // Asumimos que está en app/components
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "ImportApp - Gestión de Importaciones",
  description: "Sistema para gestionar tu negocio de importación.",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // No es necesario `className="dark"` si el tema oscuro es el base en globals.css
    <html lang="es" className="h-full antialiased">
      <body className={`${inter.className} h-full bg-background`}>
        <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
          <Sidebar />
          <div className="flex flex-col overflow-auto">
            {" "}
            {/* Permitir scroll si el contenido es largo */}
            <main className="flex-1 p-6 lg:p-8">{children}</main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
