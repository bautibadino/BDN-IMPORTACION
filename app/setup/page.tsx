"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function SetupPage() {
  const [formData, setFormData] = useState({
    token: "setup-admin-token-2024",
    email: "admin@bdnimportacion.com",
    password: "admin123",
    name: "Administrador",
  })
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [dbSynced, setDbSynced] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult("")

    try {
      const response = await fetch("/api/setup/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`✅ Usuario creado exitosamente: ${data.user.email}`)
        setIsSuccess(true)
      } else {
        setResult(`❌ Error: ${data.error}`)
        setIsSuccess(false)
      }
    } catch (error) {
      setResult("❌ Error al conectar con el servidor")
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncDB = async () => {
    setIsLoading(true)
    setResult("")

    try {
      const response = await fetch("/api/setup/sync-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: formData.token }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult("✅ Base de datos sincronizada exitosamente")
        setDbSynced(true)
      } else {
        setResult(`❌ Error al sincronizar DB: ${data.error}`)
      }
    } catch (error) {
      setResult("❌ Error al conectar con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-red-600">
            ⚠️ SETUP ADMIN
          </CardTitle>
          <CardDescription className="text-center">
            Úsalo solo UNA VEZ para crear el admin. Elimina después.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {result && (
              <Alert variant={isSuccess ? "default" : "destructive"}>
                <AlertDescription>{result}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="token">Token de Setup</Label>
              <Input
                id="token"
                name="token"
                type="text"
                value={formData.token}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Button 
                type="button"
                onClick={handleSyncDB}
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={isLoading || dbSynced}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dbSynced ? "✅ DB Sincronizada" : "1. Sincronizar Base de Datos"}
              </Button>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700" 
                disabled={isLoading || isSuccess || !dbSynced}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSuccess ? "✅ Admin Creado" : "2. Crear Usuario Admin"}
              </Button>
            </div>

            {isSuccess && (
              <div className="text-center text-sm text-red-600 font-medium">
                🚨 ELIMINA esta página ahora por seguridad!
              </div>
            )}
          </CardContent>
        </form>
      </Card>
    </div>
  )
} 