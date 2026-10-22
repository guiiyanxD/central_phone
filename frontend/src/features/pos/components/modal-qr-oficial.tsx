import React from 'react';
import { QrCode } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ModalQrOficialProps {
  isOpen: boolean;
  onClose: () => void;
  configuracion: any;
  totalBs: number;
}

export function ModalQrOficial({
  isOpen,
  onClose,
  configuracion,
  totalBs,
}: ModalQrOficialProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cobro QR Oficial CentralPhone"
      description="Proyecta este código al cliente para recibir el pago en la cuenta única de la empresa."
    >
      <div className="space-y-4 text-center pt-2">
        <div className="mx-auto w-64 h-64 rounded-xl border border-slate-200 bg-white p-3 flex flex-col items-center justify-center shadow-subtle overflow-hidden">
          {configuracion?.qrOficialImagenUrl ? (
            <img
              src={configuracion.qrOficialImagenUrl}
              alt="QR Oficial CentralPhone"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <QrCode className="h-32 w-32 text-slate-900" />
              <span className="text-[10px] font-bold tracking-wider text-slate-700 mt-2">
                SIMPLE QR • BOLIVIA
              </span>
            </>
          )}
        </div>

        <div className="text-xs text-left font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
          <div>
            <span className="text-slate-500">Titular:</span>{' '}
            <strong className="text-slate-900">
              {configuracion?.titularCuenta || 'CentralPhone'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500">Banco:</span>{' '}
            <strong className="text-slate-900">
              {configuracion?.bancoOficial || 'Banco de Crédito BCP'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500">Cuenta:</span>{' '}
            <strong className="text-slate-900">
              {configuracion?.numeroCuenta || '201-50893214-3-12'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500">Monto:</span>{' '}
            <strong className="text-slate-900">Bs {totalBs.toFixed(2)}</strong>
          </div>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={onClose}
        >
          Listo, Continuar Cobro
        </Button>
      </div>
    </Modal>
  );
}
