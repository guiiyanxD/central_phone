import React from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNombreCaja } from '@/lib/utils';

interface PosHeaderProps {
  sessionData: any;
  user: any;
  isAdmin: boolean;
}

export function PosHeader({ sessionData, user, isAdmin }: PosHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Punto de Venta (POS Mostrador)
          </h1>
          <Badge variant="success" className="gap-1.5 font-medium">
            <Building2 className="h-3 w-3" />
            {formatNombreCaja(
              sessionData.caja.fechaApertura,
              sessionData.caja.sucursal?.nombre || user?.sucursal?.nombre,
              'badge'
            )}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Escanear IMEI o seleccionar lotes de accesorios con cobro en efectivo o QR Corporativo BCP.
        </p>
      </div>

      <Link href="/caja">
        <Button variant="outline" size="sm" className="text-xs">
          {isAdmin
            ? `Ver Balance de Caja (Bs ${sessionData.resumenFinanciero?.saldoEfectivoEnCaja?.toFixed(2)})`
            : `Ver ${formatNombreCaja(
                sessionData.caja.fechaApertura,
                sessionData.caja.sucursal?.nombre || user?.sucursal?.nombre,
                'compact'
              )}`}
        </Button>
      </Link>
    </div>
  );
}
