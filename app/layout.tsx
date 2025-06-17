import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProviderWrapper } from "@/components/providers/session-provider"
import { ConditionalLayout } from "@/components/layouts/conditional-layout"
import { CurrencyProvider } from "@/contexts/CurrencyContext"
import { auth } from "@/lib/auth"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "BDN Importación",
  description: "Sistema de gestión de importaciones",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang="es" className="h-full antialiased">
      <body className={`${inter.className} ${geistSans.variable} ${geistMono.variable} h-full bg-background`}>
        <SessionProviderWrapper session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CurrencyProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </CurrencyProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
