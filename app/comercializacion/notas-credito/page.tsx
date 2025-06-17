import CreditNotesTable from '@/components/comercializacion/credit-notes-table'

export default function NotasCreditoPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notas de Crédito y Débito</h1>
        <p className="text-gray-600 mt-2">
          Gestiona las notas de crédito y débito para cancelar o ajustar facturas emitidas.
        </p>
      </div>
      
      <CreditNotesTable />
    </div>
  )
} 