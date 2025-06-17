'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Receipt, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send,
  AlertTriangle 
} from 'lucide-react';

interface Sale {
  id: string;
  saleNumber: string;
  isWhiteInvoice: boolean;
  invoiceType: string;
  pointOfSale: string;
  invoiceNumber?: number;
  fullNumber?: string;
  authCode?: string;
  authCodeExpiry?: string;
  total: number;
  customer: {
    businessName: string;
  };
}

interface AfipStatusProps {
  sale: Sale;
  onAfipInvoice?: () => void;
}

export default function AfipStatus({ sale, onAfipInvoice }: AfipStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInvoice = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sales/afip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saleId: sale.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar factura');
      }

      if (onAfipInvoice) {
        onAfipInvoice();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!sale.isWhiteInvoice) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          En Negro
        </Badge>
      );
    }

    if (sale.authCode) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Facturada
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Pendiente
      </Badge>
    );
  };

  const isFacturable = sale.isWhiteInvoice && !sale.authCode;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5" />
          Estado AFIP
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Venta:</span>
            <div className="text-muted-foreground">{sale.saleNumber}</div>
          </div>
          <div>
            <span className="font-medium">Tipo:</span>
            <div className="text-muted-foreground">{sale.invoiceType}</div>
          </div>
          <div>
            <span className="font-medium">Cliente:</span>
            <div className="text-muted-foreground">{sale.customer.businessName}</div>
          </div>
          <div>
            <span className="font-medium">Total:</span>
            <div className="text-muted-foreground">${sale.total.toLocaleString()}</div>
          </div>
        </div>

        {sale.authCode && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="font-medium text-green-800">Número de Factura:</span>
                <div className="text-green-700">{sale.fullNumber}</div>
              </div>
              <div>
                <span className="font-medium text-green-800">CAE:</span>
                <div className="text-green-700 font-mono">{sale.authCode}</div>
              </div>
              {sale.authCodeExpiry && (
                <div>
                  <span className="font-medium text-green-800">Vencimiento CAE:</span>
                  <div className="text-green-700">
                    {new Date(sale.authCodeExpiry).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isFacturable && (
          <Button 
            onClick={handleGenerateInvoice}
            disabled={isLoading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Generando factura...' : 'Generar Factura AFIP'}
          </Button>
        )}

        {!sale.isWhiteInvoice && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta venta está marcada como "en negro" y no se facturará en AFIP.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 