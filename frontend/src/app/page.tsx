'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  PackagePlus,
  Smartphone,
  Receipt,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Eye,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function WelcomeHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [featureNotice, setFeatureNotice] = useState<string | null>(null);
  const [configuracion, setConfiguracion] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.configuracion.get().then((data) => setConfiguracion(data)).catch(() => {});
  }, []);

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

  const handleCopyAccount = () => {
    const num = configuracion?.numeroCuenta || '201-50893214-3-12';
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(num);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 animate-in fade-in duration-300">
      {/* Saludo de Bienvenida y Propósito */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Panel de Operaciones
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Terminal de mostrador y gestión física de inventario para CentralPhone.
        </p>
      </div>

      {featureNotice && (
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-800 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">Aviso:</span>
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

      {/* ========================================================= */}
      {/* 1. BANNER DESTACADO SUPERIOR: COBRO QR CORPORATIVO OFICIAL */}
      {/* ========================================================= */}
      <div
        data-testid="banner-qr-oficial"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden"
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <QrCode className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-slate-900">
                Cobro QR Oficial CentralPhone
              </span>
              <Badge variant="success" className="text-[10px] gap-1 px-2 py-0.5">
                <ShieldCheck className="h-3 w-3" /> Verificado • Anti-Fraude
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              <strong className="text-slate-800">{configuracion?.bancoOficial || 'Banco de Crédito BCP'}</strong> • Titular:{' '}
              <strong className="text-slate-800">{configuracion?.titularCuenta || 'CentralPhone'}</strong> • Cuenta:{' '}
              <span className="font-mono text-slate-700 font-semibold">{configuracion?.numeroCuenta || '201-50893214-3-12'}</span>
            </p>
          </div>
        </div>

        <Button
          variant="default"
          size="default"
          className="self-stretch sm:self-center font-semibold text-xs h-10 px-4 shadow-sm"
          onClick={() => setShowQrModal(true)}
        >
          <Eye className="mr-2 h-4 w-4 text-slate-300" />
          Proyectar QR Oficial al Cliente
        </Button>
      </div>

      {/* ========================================================= */}
      {/* 2. GRID DE ACCESOS DIRECTOS PRINCIPALES (OPERACIONES)    */}
      {/* ========================================================= */}
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
              <Badge variant="outline">Caja Activa</Badge>
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
              <span>Gestionar Caja Diaria</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* MODAL AMPLIADO: PROYECCIÓN DEL CÓDIGO QR OFICIAL (P0-04)   */}
      {/* ========================================================= */}
      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">
              QR Oficial CentralPhone
            </span>
            <Badge variant="success" className="text-[10px]">Simple QR Bolivia</Badge>
          </div>
        }
        description="Proyección a mostrador para escaneo inmediato desde la app bancaria del cliente"
        className="max-w-xl text-center space-y-6"
        dataTestId="modal-qr-ampliado"
      >
        <div className="space-y-6 pt-2">
          {/* Contenedor del QR Ampliado (clases estándar) */}
          <div className="mx-auto w-72 h-72 sm:w-80 sm:h-80 rounded-2xl border-2 border-slate-200 bg-white p-4 flex items-center justify-center overflow-hidden shadow-subtle">
            {configuracion?.qrOficialImagenUrl ? (
              <img
                src={configuracion.qrOficialImagenUrl}
                alt="QR Oficial CentralPhone"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 p-4 text-slate-900">
                <QrCode className="h-44 w-44 text-slate-900" />
                <span className="text-[11px] font-bold tracking-wider text-slate-600 mt-2">
                  SIMPLE QR • BANCA BOLIVIANA
                </span>
              </div>
            )}
          </div>

          {/* Tarjeta de Datos Bancarios de Confirmación */}
          <div className="text-xs text-left bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Banco Receptor:</span>
              <strong className="text-slate-900 font-bold">{configuracion?.bancoOficial || 'Banco de Crédito BCP'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Titular de Cuenta:</span>
              <strong className="text-slate-900 font-bold">{configuracion?.titularCuenta || 'CentralPhone'}</strong>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Número de Cuenta:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900">
                  {configuracion?.numeroCuenta || '201-50893214-3-12'}
                </span>
                <button
                  onClick={handleCopyAccount}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-colors"
                  title="Copiar número de cuenta"
                  aria-label="Copiar número de cuenta bancaria"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            variant="default"
            size="lg"
            className="w-full font-semibold"
            onClick={() => setShowQrModal(false)}
          >
            Cerrar Vista de Pago
          </Button>
        </div>
      </Modal>
    </div>
  );
}
