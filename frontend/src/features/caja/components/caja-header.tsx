import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Lock,
  Plus,
  ShoppingCart,
  Receipt,
  History,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNombreCaja } from '@/lib/utils';

interface CajaHeaderProps {
  sessionData: any;
  user: any;
  isAdmin: boolean;
  activeTab: 'turno' | 'historial' | 'recepciones';
  setActiveTab: (tab: 'turno' | 'historial' | 'recepciones') => void;
  onOpenGastoModal: () => void;
  onOpenCierreModal: () => void;
}

export function CajaHeader({
  sessionData,
  user,
  isAdmin,
  activeTab,
  setActiveTab,
  onOpenGastoModal,
  onOpenCierreModal,
}: CajaHeaderProps) {
  const isCajaAbierta = !!sessionData?.caja;

  return (
    <div className="space-y-4 border-b border-slate-200 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Control de Caja Diaria & Arqueo
            </h1>
            {isCajaAbierta && (
              <Badge variant="success" className="gap-1.5 font-medium">
                <Building2 className="h-3 w-3" />
                {formatNombreCaja(
                  sessionData.caja.fechaApertura,
                  sessionData.caja.sucursal?.nombre || user?.sucursal?.nombre,
                  'badge'
                )}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de turnos de mostrador, arqueo físico a ciegas, egresos menores y auditoría financiera.
          </p>
        </div>

        {isCajaAbierta && (
          <div className="flex items-center gap-2">
            <Link href="/pos">
              <Button size="sm" variant="outline" className="text-xs">
                <ShoppingCart className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
                Ir a Cobrar al POS
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={onOpenGastoModal}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Egreso Menor
            </Button>
            <Button
              size="sm"
              variant="default"
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white"
              onClick={onOpenCierreModal}
            >
              <Lock className="mr-1.5 h-3.5 w-3.5" />
              Arqueo & Cierre
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Principales de Navegación */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'turno' | 'historial' | 'recepciones')}
      >
        <TabsList variant="line" className="w-full justify-start pb-2">
          <TabsTrigger value="turno" variant="line">
            <Receipt className="h-3.5 w-3.5 mr-1" />
            <span>Turno Activo</span>
          </TabsTrigger>
          <TabsTrigger value="historial" variant="line">
            <History className="h-3.5 w-3.5 mr-1" />
            <span>Historial de Cajas Diarias</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="recepciones" variant="line">
              <Truck className="h-3.5 w-3.5 mr-1" />
              <span>Recepciones de Mercadería</span>
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
}
