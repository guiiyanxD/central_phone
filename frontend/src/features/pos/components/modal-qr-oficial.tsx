import React from 'react';
import { QrCode, CheckCircle2, ShieldCheck, ArrowRight, User } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartItem } from '../types';

interface ModalQrOficialProps {
  isOpen: boolean;
  onClose: () => void;
  configuracion: any;
  totalBs: number;
  cart?: CartItem[];
  clienteNombre?: string;
  comprobanteRef?: string;
  setComprobanteRef?: (val: string) => void;
  isMixto?: boolean;
  montoEfectivoMixtoBs?: number | '';
  saldoQrBs?: number;
  isSubmittingSale?: boolean;
  onConfirmCheckout?: () => void;
}

export function ModalQrOficial({
  isOpen,
  onClose,
  configuracion,
  totalBs,
  cart = [],
  clienteNombre,
  comprobanteRef = '',
  setComprobanteRef,
  isMixto = false,
  montoEfectivoMixtoBs = '',
  saldoQrBs,
  isSubmittingSale = false,
  onConfirmCheckout,
}: ModalQrOficialProps) {
  const montoQrFinal = isMixto && typeof saldoQrBs === 'number' ? saldoQrBs : totalBs;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cobro QR Oficial CentralPhone"
      description="Proyección en alta resolución para el cliente y validación operativa en mostrador."
      className="max-w-4xl p-0 overflow-hidden rounded-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
        {/* PANEL IZQUIERDO: PROYECCIÓN AL CLIENTE (7 COLUMNAS) */}
        <div className="md:col-span-7 bg-slate-950 text-white p-6 flex flex-col items-center justify-between relative overflow-hidden">
          {/* Fondo sutil de seguridad */}
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Encabezado de Identidad Bancaria */}
          <div className="text-center w-full z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>QR Verificado • Cuenta Única Oficial</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Escanea desde cualquier app bancaria en Bolivia (BCP, BNB, BMSC, Unión)
            </p>
          </div>

          {/* Visualizador QR en Alta Definición */}
          <div className="my-4 w-60 h-60 bg-white rounded-2xl p-3 shadow-2xl flex flex-col items-center justify-center overflow-hidden border-2 border-slate-800 z-10">
            {configuracion?.qrOficialImagenUrl ? (
              <img
                src={configuracion.qrOficialImagenUrl}
                alt="QR Oficial CentralPhone BCP"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-4">
                <QrCode className="h-28 w-28 text-slate-900 mx-auto" />
                <span className="text-[10px] font-bold text-slate-600 tracking-wider block mt-2">
                  SIMPLE QR • BOLIVIA
                </span>
              </div>
            )}
          </div>

          {/* Bloque Destacado de Monto y Cuenta */}
          <div className="w-full text-center z-10 space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              {isMixto ? 'Saldo a Transferir por QR:' : 'Monto Exacto a Transferir:'}
            </span>
            <div className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              Bs {montoQrFinal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-mono text-slate-400 pt-1">
              {configuracion?.bancoOficial || 'Banco de Crédito BCP'} • {configuracion?.titularCuenta || 'CentralPhone'}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Cta: {configuracion?.numeroCuenta || '201-50893214-3-12'}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: SUPERVISIÓN Y CONTROL DEL CAJERO (5 COLUMNAS) */}
        <div className="md:col-span-5 bg-white p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Supervisión de Mostrador
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-700 font-semibold">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span className="truncate">{clienteNombre || 'Comprador casual'}</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {cart.length} producto{cart.length === 1 ? '' : 's'} en ticket
              </span>
            </div>

            {/* Desglose en caso de Pago Mixto */}
            {isMixto && typeof montoEfectivoMixtoBs === 'number' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Anticipo en Efectivo:</span>
                  <strong className="text-slate-900">Bs {montoEfectivoMixtoBs.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200/60 pt-1">
                  <span>Saldo Digital QR:</span>
                  <span>Bs {montoQrFinal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Entrada del Número de Referencia Bancaria */}
            <div className="space-y-2">
              <label htmlFor="modalComprobanteRef" className="text-xs font-bold text-slate-800 block">
                Nro. de Comprobante Bancario <span className="text-rose-600">*</span>
              </label>
              <Input
                id="modalComprobanteRef"
                autoFocus
                placeholder="Ej: 8492013 o últimos 6 dígitos"
                value={comprobanteRef}
                onChange={(e) => setComprobanteRef && setComprobanteRef(e.target.value)}
                className="text-xs font-mono bg-white h-10 font-bold"
              />
              <p className="text-[11px] text-slate-500 leading-tight">
                Pide al cliente que muestre la pantalla de confirmación en su teléfono para registrar el número de operación.
              </p>
            </div>
          </div>

          {/* Botones de Acción para el Cajero */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            {onConfirmCheckout ? (
              <Button
                type="button"
                className="w-full font-semibold h-11"
                disabled={!comprobanteRef.trim() || isSubmittingSale}
                isLoading={isSubmittingSale}
                loadingText="Registrando cobro..."
                onClick={onConfirmCheckout}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Confirmar Pago y Emitir Ticket
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full font-semibold h-11"
                onClick={onClose}
              >
                Continuar a Terminal
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs text-slate-500 hover:text-slate-800"
              onClick={onClose}
            >
              Cerrar y Volver a Editar Ticket (Esc)
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
