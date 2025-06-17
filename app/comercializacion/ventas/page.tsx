'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Users,
  FileText,
  ShoppingCart,
  Plus,
  TrendingUp,
  Calendar,
  Search,
  Filter
} from "lucide-react"
import Link from 'next/link'
import { SalesTable } from '@/components/comercializacion/sales-table'
import { CustomersTable } from '@/components/comercializacion/customers-table'
import { CurrentAccountTable } from '@/components/comercializacion/current-account-table'
import { QuotesTable } from '@/components/comercializacion/quotes-table'

interface DashboardStats {
  salesThisMonth: {
    total: number
    count: number
    growth: number
  }
  activeCustomers: {
    total: number
    newThisMonth: number
  }
  pendingQuotes: {
    total: number
    count: number
  }
  salesToday: {
    total: number
    count: number
  }
}

interface RecentActivity {
  recentSales: Array<{
    id: string
    cliente: string
    total: number
    estado: string
    fecha: Date
  }>
  expiringQuotes: Array<{
    id: string
    cliente: string
    total: number
    vence: string
  }>
}

export default function VentasPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Centro de Ventas</h1>
        <p className="text-gray-600">Gestión completa de ventas, clientes, presupuestos y facturación</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="presupuestos">Presupuestos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="cuenta-corriente">Cuenta Corriente</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : formatCurrency(stats?.salesThisMonth.total || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {!loading && stats && (
                    <span className={stats.salesThisMonth.growth >= 0 ? "text-green-600" : "text-red-600"}>
                      {stats.salesThisMonth.growth >= 0 ? '+' : ''}{stats.salesThisMonth.growth}%
                    </span>
                  )} vs mes anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats?.activeCustomers.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {!loading && stats && (
                    <span className="text-green-600">+{stats.activeCustomers.newThisMonth}</span>
                  )} nuevos este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Presupuestos Pendientes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats?.pendingQuotes.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {!loading && stats && `Por valor de ${formatCurrency(stats.pendingQuotes.total)}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats?.salesToday.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {!loading && stats && `Total: ${formatCurrency(stats.salesToday.total)}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Tareas comunes del día a día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/comercializacion/ventas/nueva">
                  <Button className="w-full h-20 flex flex-col gap-2">
                    <Plus className="h-6 w-6" />
                    Nueva Venta
                  </Button>
                </Link>
                <Link href="/comercializacion/ventas/presupuestos/nuevo">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <FileText className="h-6 w-6" />
                    Nuevo Presupuesto
                  </Button>
                </Link>
                <Link href="/comercializacion/ventas/clientes/nuevo">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Users className="h-6 w-6" />
                    Nuevo Cliente
                  </Button>
                </Link>
                <Link href="/comercializacion/ventas/reportes">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Ver Reportes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-4 text-gray-500">Cargando...</div>
                  ) : recentActivity?.recentSales.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No hay ventas recientes</div>
                  ) : (
                    recentActivity?.recentSales.map((venta) => (
                      <Link key={venta.id} href={`/comercializacion/ventas/${venta.id}`}>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div>
                            <p className="font-medium">{venta.id}</p>
                            <p className="text-sm text-gray-600">{venta.cliente}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(venta.total)}</p>
                            <Badge 
                              variant={venta.estado === 'entregada' ? 'default' : 
                                      venta.estado === 'facturada' ? 'secondary' : 'outline'}
                            >
                              {venta.estado}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <Link href="/comercializacion/ventas?tab=ventas">
                  <Button variant="outline" className="w-full mt-4">
                    Ver Todas las Ventas
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Presupuestos por Vencer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-4 text-gray-500">Cargando...</div>
                  ) : recentActivity?.expiringQuotes.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No hay presupuestos por vencer</div>
                  ) : (
                    recentActivity?.expiringQuotes.map((presupuesto) => (
                      <div key={presupuesto.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{presupuesto.id}</p>
                          <p className="text-sm text-gray-600">{presupuesto.cliente}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(presupuesto.total)}</p>
                          <p className="text-sm text-orange-600">Vence en {presupuesto.vence}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link href="/comercializacion/ventas?tab=presupuestos">
                  <Button variant="outline" className="w-full mt-4">
                    Ver Todos los Presupuestos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ventas" className="space-y-6">
          <SalesTable />
        </TabsContent>

        <TabsContent value="presupuestos" className="space-y-6">
          <QuotesTable />
        </TabsContent>

        <TabsContent value="clientes" className="space-y-6">
          <CustomersTable />
        </TabsContent>

        <TabsContent value="cuenta-corriente" className="space-y-6">
          <CurrentAccountTable />
        </TabsContent>
      </Tabs>
    </div>
  )
} 