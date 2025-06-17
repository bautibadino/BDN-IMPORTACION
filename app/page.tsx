import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, Package2 } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">BDN Importación</h1>
        <p className="text-gray-600">Sistema de gestión integral para importación y comercialización</p>
      </div>
      
      {/* Métricas generales */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Total Importaciones</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+23</div>
            <p className="text-xs text-muted-foreground">+2 nuevos esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Importaciones en Curso</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">+5 en tránsito</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos en Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">+198 desde la última importación</p>
          </CardContent>
        </Card>
      </div>

      {/* Módulos principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Módulo de Importación
            </CardTitle>
            <CardDescription>
              Gestión completa del proceso de importación, proveedores y leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Proveedores</span>
                <span className="font-medium">23 activos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Leads</span>
                <span className="font-medium">15 en seguimiento</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Importaciones</span>
                <span className="font-medium">12 en curso</span>
              </div>
            </div>
            <Link href="/importacion">
              <Button className="w-full">
                Acceder al Módulo
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package2 className="w-6 h-6" />
              Módulo de Comercialización
            </CardTitle>
            <CardDescription>
              Gestión de productos, ventas y canales de comercialización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Productos</span>
                <span className="font-medium">573 en stock</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Mercadolibre</span>
                <span className="font-medium text-gray-500">En desarrollo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ventas</span>
                <span className="font-medium text-gray-500">En desarrollo</span>
              </div>
            </div>
            <Link href="/comercializacion">
              <Button className="w-full">
                Acceder al Módulo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
