'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  PackagePlus,
  Smartphone,
  Receipt,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function WelcomeHubPage() {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [featureNotice, setFeatureNotice] = useState<string | null>(null);
  const [configuracion, setConfiguracion] = useState<any | null>(null);

  useEffect(() => {
    api.configuracion.get().then((data) => setConfiguracion(data)).catch(() => {});
  }, []);

  // Microinteracción: feedback visual con spinner y transición fluida
  const handleLaunchFlow = (flowId: string) => {
    setActiveAction(flowId);
    if (flowId === 'recepcion') {
      router.push('/recepcion');
    } else if (flowId === 'inventario') {
      router.push('/inventario');
    } else if (flowId === 'configuracion') {
      router.push('/configuracion');
    } else if (flowId === 'pos') {
      router.push('/pos');
    } else if (flowId === 'caja') {
      router.push('/caja');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4 animate-in fade-in duration-300">
      {/* Saludo de Bienvenida y Propósito */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Panel de Operaciones
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Selecciona una de las actividades principales para iniciar la atención en mostrador o la gestión de mercadería.
        </p>
      </div>

      {featureNotice && (
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-800 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">Aviso de Roadmap:</span>
            <span>{featureNotice}</span>
          </div>
          <button
            onClick={() => setFeatureNotice(null)}
            className="text-slate-600 hover:text-slate-900 text-xs font-semibold"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Grid de Accesos Directos Principales (Portales de Flujo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Punto de Venta (POS) */}
        <Card className="hover:border-slate-300 hover:shadow-card transition-all duration-200 group flex flex-col justify-between">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#363EFF] to-[#2B32E0] text-white flex items-center justify-center shadow-md shadow-[#363EFF]/20">
                <CreditCard className="h-5 w-5" />
              </div>
              <Badge variant="success">Caja Lista</Badge>
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Punto de Venta (POS)
            </CardTitle>
            <CardDescription className="text-slate-600 mt-1 leading-relaxed">
              Atender ventas en mostrador, escanear teléfonos por IMEI y cobrar en efectivo o mediante el código QR oficial.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Button
              className="w-full justify-between"
              isLoading={activeAction === 'pos'}
              loadingText="Iniciando terminal..."
              onClick={() => handleLaunchFlow('pos')}
            >
              <span>Abrir Terminal de Venta</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </CardContent>
        </Card>

        {/* 2. Recepción de Mercadería */}
        <Card className="hover:border-slate-300 hover:shadow-card transition-all duration-200 group flex flex-col justify-between">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white shadow-md shadow-[#F97316]/20 flex items-center justify-center">
                <PackagePlus className="h-5 w-5" />
              </div>
              <Badge variant="outline">Ingreso Unificado</Badge>
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Recepción de Mercadería
            </CardTitle>
            <CardDescription className="text-slate-600 mt-1 leading-relaxed">
              Registrar entregas de proveedores mayoristas, validando IMEIs únicos de teléfonos y lotes diferenciados de accesorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Button
              variant="outline"
              className="w-full justify-between hover:border-[#F97316]/40 hover:text-[#EA580C]"
              isLoading={activeAction === 'recepcion'}
              loadingText="Abriendo formulario..."
              onClick={() => handleLaunchFlow('recepcion')}
            >
              <span>Registrar Nota de Ingreso</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </CardContent>
        </Card>

        {/* 3. Control de Inventario & IMEIs */}
        <Card className="hover:border-slate-300 hover:shadow-card transition-all duration-200 group flex flex-col justify-between">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                <Smartphone className="h-5 w-5" />
              </div>
              <Badge variant="mono">Serializado</Badge>
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Control de Inventario
            </CardTitle>
            <CardDescription className="text-slate-600 mt-1 leading-relaxed">
              Búsqueda instantánea de equipos por IMEI o número de serie, estados de disponibilidad y existencias de lotes de accesorios.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Button
              variant="outline"
              className="w-full justify-between hover:border-slate-400"
              isLoading={activeAction === 'inventario'}
              loadingText="Consultando inventario..."
              onClick={() => handleLaunchFlow('inventario')}
            >
              <span>Explorar Stock de Tienda</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </CardContent>
        </Card>

        {/* 4. Caja Diaria & Arqueo */}
        <Card className="hover:border-slate-300 hover:shadow-card transition-all duration-200 group flex flex-col justify-between">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Receipt className="h-5 w-5" />
              </div>
              <Badge variant="outline">Turno Activo</Badge>
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Caja Diaria & Arqueo
            </CardTitle>
            <CardDescription className="text-slate-600 mt-1 leading-relaxed">
              Supervisar el flujo de efectivo, registrar egresos menores autorizados (chips, refrigerios) y realizar el arqueo de cierre ciego.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Button
              variant="outline"
              className="w-full justify-between"
              isLoading={activeAction === 'caja'}
              loadingText="Cargando balance..."
              onClick={() => handleLaunchFlow('caja')}
            >
              <span>Gestionar Turno de Caja</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Resumen Rápido y Seguridad Anti-Fraude */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 flex-shrink-0">
            <QrCode className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                Cobro QR Oficial Centralizado
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-800 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                <ShieldCheck className="h-3 w-3" /> Verificado
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {configuracion?.bancoOficial || 'Banco de Crédito BCP'} • Titular: {configuracion?.titularCuenta || 'CentralPhone'} • Cuenta receptora única de la empresa
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 self-start sm:self-center"
          onClick={() => setShowQrModal(true)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
          Ver QR Oficial
        </Button>
      </div>

      {/* Modal de Proyección de QR Oficial al Cliente */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-elevated text-center space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-left">
                <h3 className="text-base font-bold text-slate-900">
                  QR Oficial CentralPhone
                </h3>
                <p className="text-xs text-slate-500">
                  Cuenta Corporativa Única
                </p>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mx-auto w-64 h-64 rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-center overflow-hidden shadow-subtle">
              {configuracion?.qrOficialImagenUrl ? (
                <img
                  src={configuracion.qrOficialImagenUrl}
                  alt="QR Oficial CentralPhone"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full border border-slate-200 rounded-lg flex flex-col items-center justify-center bg-white p-2 text-slate-900">
                  <QrCode className="h-32 w-32 text-slate-900" />
                  <span className="text-[9px] font-bold tracking-wider text-slate-600 mt-1">
                    SIMPLE QR • BOLIVIA
                  </span>
                </div>
              )}
            </div>

            <div className="text-xs text-left font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div><span className="text-slate-500">Titular:</span> <strong className="text-slate-900">{configuracion?.titularCuenta || 'CentralPhone'}</strong></div>
              <div><span className="text-slate-500">Banco:</span> <strong className="text-slate-900">{configuracion?.bancoOficial || 'Banco de Crédito BCP'}</strong></div>
              <div><span className="text-slate-500">Cuenta:</span> <strong className="text-slate-900">{configuracion?.numeroCuenta || '201-50893214-3-12'}</strong></div>
            </div>

            <Button
              variant="default"
              className="w-full"
              onClick={() => setShowQrModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
