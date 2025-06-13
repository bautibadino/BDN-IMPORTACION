"use client"

import { PageHeader } from "@/app/components/page-header"
import ExchangeRateSettings from "@/components/settings/ExchangeRateSettings"

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Configuración"
        description="Gestiona las configuraciones del sistema de importación"
      />

      <div className="grid gap-6 max-w-2xl">
        <ExchangeRateSettings />
      </div>
    </>
  )
} 