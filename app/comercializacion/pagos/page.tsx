import PaymentsTable from '@/components/comercializacion/payments-table';

export default function PaymentsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
          <p className="text-gray-600">
            Administra todos los pagos, cheques, transferencias y métodos de pago
          </p>
        </div>
      </div>

      <PaymentsTable />
    </div>
  );
} 