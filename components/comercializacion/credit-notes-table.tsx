'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import CreditNoteForm from './credit-note-form';

interface CreditNote {
  id: string;
  creditNoteNumber: string;
  type: string;
  status: string;
  reason: string;
  description: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  issueDate: string;
  customer: {
    id: string;
    businessName: string;
    taxId?: string;
  };
  originalSale?: {
    id: string;
    saleNumber: string;
    total: number;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    description: string;
    product?: {
      name: string;
      internalCode?: string;
    };
  }>;
}

interface Customer {
  id: string;
  businessName: string;
  taxId?: string;
}

const CREDIT_NOTE_STATUS = [
  { value: 'borrador', label: 'Borrador', variant: 'secondary' as const },
  { value: 'emitida', label: 'Emitida', variant: 'default' as const },
  { value: 'aplicada', label: 'Aplicada', variant: 'default' as const },
  { value: 'anulada', label: 'Anulada', variant: 'destructive' as const }
];

const CREDIT_NOTE_REASONS = [
  { value: 'devolucion', label: 'Devolución' },
  { value: 'descuento', label: 'Descuento' },
  { value: 'error_facturacion', label: 'Error Facturación' },
  { value: 'anulacion', label: 'Anulación' },
  { value: 'ajuste_precio', label: 'Ajuste Precio' },
  { value: 'garantia', label: 'Garantía' },
  { value: 'otros', label: 'Otros' }
];

export default function CreditNotesTable() {
  const [loading, setLoading] = useState(true);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Filtros
  const [filters, setFilters] = useState({
    customerId: 'all',
    status: 'all',
    type: 'all',
    search: ''
  });

  // Cargar datos
  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        customerId: filters.customerId,
        status: filters.status,
        type: filters.type
      });

      const response = await fetch(`/api/credit-notes?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setCreditNotes(data.creditNotes);
        setPagination(data.pagination);
      } else {
        console.error('Error al cargar notas de crédito');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchCreditNotes();
  }, [pagination.page, pagination.limit, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = CREDIT_NOTE_STATUS.find(s => s.value === status);
    return (
      <Badge variant={statusConfig?.variant || 'default'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    const reasonConfig = CREDIT_NOTE_REASONS.find(r => r.value === reason);
    return reasonConfig?.label || reason;
  };

  const handleCreateCreditNote = (creditNote: CreditNote) => {
    setCreditNotes([creditNote, ...creditNotes]);
    setShowForm(false);
    fetchCreditNotes(); // Recargar para tener datos actualizados
  };

  const filteredCreditNotes = creditNotes.filter(note => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        note.creditNoteNumber.toLowerCase().includes(searchLower) ||
        note.customer.businessName.toLowerCase().includes(searchLower) ||
        note.description.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (showForm) {
    return (
      <CreditNoteForm
        onSuccess={handleCreateCreditNote}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas de Crédito y Débito
          </CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Nota de Crédito
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search"
                placeholder="Número, cliente, descripción..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="customer">Cliente</Label>
            <Select 
              value={filters.customerId} 
              onValueChange={(value) => setFilters({...filters, customerId: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Estado</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {CREDIT_NOTE_STATUS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select 
              value={filters.type} 
              onValueChange={(value) => setFilters({...filters, type: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="NOTA_CREDITO_A">Nota Crédito A</SelectItem>
                <SelectItem value="NOTA_CREDITO_B">Nota Crédito B</SelectItem>
                <SelectItem value="NOTA_CREDITO_C">Nota Crédito C</SelectItem>
                <SelectItem value="NOTA_DEBITO_A">Nota Débito A</SelectItem>
                <SelectItem value="NOTA_DEBITO_B">Nota Débito B</SelectItem>
                <SelectItem value="NOTA_DEBITO_C">Nota Débito C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                customerId: 'all',
                status: 'all',
                type: 'all',
                search: ''
              })}
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="text-center py-8">Cargando notas de crédito...</div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Venta Original</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCreditNotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No se encontraron notas de crédito
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCreditNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">
                          {note.creditNoteNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{note.customer.businessName}</div>
                            {note.customer.taxId && (
                              <div className="text-sm text-gray-500">{note.customer.taxId}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {note.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(note.status)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{getReasonLabel(note.reason)}</div>
                            <div className="text-sm text-gray-500 truncate max-w-32">
                              {note.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(note.issueDate)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(note.total)}
                        </TableCell>
                        <TableCell>
                          {note.originalSale ? (
                            <div className="text-sm">
                              <div className="font-medium">{note.originalSale.saleNumber}</div>
                              <div className="text-gray-500">
                                {formatCurrency(note.originalSale.total)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {note.status === 'borrador' && (
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} resultados
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                    disabled={pagination.page <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 