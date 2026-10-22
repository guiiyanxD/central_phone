import React from 'react';
import { Printer } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ModalTicketVentaProps {
  sale: any;
  onClose: () => void;
  onPrintReceipt: () => void;
}

export function ModalTicketVenta({
  sale,
  onClose,
  onPrintReceipt,
}: ModalTicketVentaProps) {
  if (!sale) return null;

  return (
    <Modal
      isOpen={!!sale}
      onClose={onClose}
      title="Comprobante de Venta"
      description={`Ticket #${sale.comprobanteReferencia}`}
    >
      <div className="space-y-4 pt-1">
        {/* Ticket Estilo Térmico Minimalista */}
        <div id="printable-ticket" className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 font-mono text-xs space-y-3">
          <div className="text-center border-b border-dashed border-slate-300 pb-2">
            <p className="font-bold text-slate-900 text-sm">CENTRALPHONE</p>
            <p className="text-[10px] text-slate-500">
              {sale.caja?.sucursal?.nombre || 'Sucursal Principal'} • {sale.caja?.sucursal?.ciudad || 'Santa Cruz, Bolivia'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Ticket: {sale.comprobanteReferencia} •{' '}
              {new Date(sale.fechaHora).toLocaleTimeString('es-BO')}
            </p>
          </div>

          <div className="space-y-1 text-[11px]">
            <p>
              <span className="text-slate-500">Atendido por:</span>{' '}
              {sale.usuario?.nombre}
            </p>
            <p>
              <span className="text-slate-500">Cliente:</span>{' '}
              <span className="font-semibold text-slate-900">
                {sale.cliente?.nombreCompleto || 'Cliente Mostrador'}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Teléfono:</span>{' '}
              <span className="font-semibold text-slate-900">
                {sale.cliente?.telefono || 'S/N'}
              </span>
            </p>
            {sale.cliente?.ciNit && (
              <p>
                <span className="text-slate-500">C.I. / NIT:</span>{' '}
                <span>{sale.cliente.ciNit}</span>
              </p>
            )}
            <p>
              <span className="text-slate-500">Método de Pago:</span>{' '}
              {sale.metodoPago?.nombre}
            </p>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
            {sale.detalles?.map((det: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <div>
                  <p className="font-bold text-slate-900">
                    {det.tipoItem === 'DISPOSITIVO'
                      ? det.dispositivo?.variante?.modelo?.nombreModelo
                      : det.loteAccesorio?.accesorio?.nombre}
                  </p>
                  {det.dispositivo && (
                    <p className="text-[9px] text-slate-500 font-mono">
                      {det.dispositivo.imei1 ? `IMEI: ${det.dispositivo.imei1}` : `S/N: ${det.dispositivo.numeroSerie}`}
                    </p>
                  )}
                </div>
                <span className="font-bold">
                  Bs {Number(det.subtotalBs).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-baseline text-sm font-bold pt-1">
            <span>TOTAL:</span>
            <span className="text-slate-900">
              Bs {Number(sale.totalVentaBs).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-xs"
            onClick={onPrintReceipt}
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Imprimir Recibo
          </Button>
          <Button
            className="flex-1 text-xs"
            onClick={onClose}
          >
            Nueva Venta
          </Button>
        </div>
      </div>
    </Modal>
  );
}
