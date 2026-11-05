import React from 'react';
import { Printer, RefreshCw } from 'lucide-react';
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
  // Atajo de teclado en comprobante: Enter para imprimir térmico
  React.useEffect(() => {
    if (!sale) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onPrintReceipt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sale, onPrintReceipt]);

  if (!sale) return null;

  const permutaDisp = sale.permutaDispositivo;
  const permutaSum = sale.permutaSummary;
  const permutaDto = sale.permuta;

  const permutaModeloDisplay =
    permutaDisp?.variante?.modelo?.nombreModelo
      ? `${permutaDisp.variante.modelo.nombreModelo} ${permutaDisp.variante.color || ''} ${permutaDisp.variante.capacidadGb > 0 ? `${permutaDisp.variante.capacidadGb}GB` : ''}`
      : permutaSum?.modeloNombre
      ? `${permutaSum.modeloNombre} ${permutaSum.varianteDetalle || ''}`
      : 'iPhone';

  const permutaImeiDisplay =
    permutaDisp?.imei1 || permutaSum?.imei1 || permutaDto?.imei1 || 'S/N';

  const permutaBateriaDisplay =
    permutaDisp?.porcentajeBateria || permutaDto?.porcentajeBateria || null;

  const fechaVentaObj = sale.fechaHora ? new Date(sale.fechaHora) : new Date();
  const fechaFinGarantia = new Date(fechaVentaObj);
  fechaFinGarantia.setDate(fechaFinGarantia.getDate() + 90);
  const fechaFinGarantiaStr = fechaFinGarantia.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

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

          {Number(sale.montoPermutaBs) > 0 ? (
            <div className="space-y-1 text-xs pt-1 border-t border-slate-200">
              <div className="flex justify-between text-slate-500">
                <span>SUBTOTAL:</span>
                <span>Bs {Number(sale.totalVentaBs).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>CRÉDITO PERMUTA:</span>
                <span>- Bs {Number(sale.montoPermutaBs).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline text-sm font-bold pt-1 text-slate-900 border-t border-dashed border-slate-300">
                <span>TOTAL COBRADO:</span>
                <span>
                  Bs {(Number(sale.totalVentaBs) - Number(sale.montoPermutaBs)).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-baseline text-sm font-bold pt-1">
              <span>TOTAL:</span>
              <span className="text-slate-900">
                Bs {Number(sale.totalVentaBs).toFixed(2)}
              </span>
            </div>
          )}

          {Number(sale.montoPermutaBs) > 0 && (
            <div className="p-2.5 rounded-lg border border-dashed border-emerald-400 bg-emerald-50/70 text-[11px] space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 text-emerald-700" />
                  Equipo Recibido en Permuta
                </span>
                <span className="font-mono text-emerald-800">
                  - Bs {Number(sale.montoPermutaBs).toFixed(2)}
                </span>
              </div>
              <p className="font-semibold text-slate-900">
                {permutaModeloDisplay}
              </p>
              <p className="font-mono text-[10px] text-slate-600">
                IMEI 1: {permutaImeiDisplay} {permutaBateriaDisplay ? `• ${permutaBateriaDisplay}% Batería` : ''}
              </p>
            </div>
          )}

          {/* Pie de Garantía Oficial */}
          <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10.5px] text-slate-500 leading-tight space-y-0.5">
            <p className="font-bold text-slate-700">*** GARANTÍA OFICIAL CENTRALPHONE ***</p>
            <p>3 Meses en Dispositivos Apple (Vence: {fechaFinGarantiaStr}).</p>
            <p>15 días en accesorios.</p>
            <p className="text-[9.5px] text-slate-400">Imprescindible presentar este ticket y número de serie/IMEI intacto para reclamos.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-xs"
            onClick={onPrintReceipt}
            title="Presiona Enter para imprimir"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Imprimir Recibo (Enter)
          </Button>
          <Button
            className="flex-1 text-xs"
            onClick={onClose}
            title="Presiona Esc para continuar"
          >
            Nueva Venta (Esc)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
