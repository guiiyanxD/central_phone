import React from 'react';
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  User,
  Banknote,
  QrCode,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CartItem } from '../types';
import { getImeiTerminalParts } from '../utils/formatters';

interface PosCartPanelProps {
  cart: CartItem[];
  totalBs: number;
  onClearCart: () => void;
  onRemoveFromCart: (cartId: string) => void;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onUpdatePrice: (cartId: string, newPrice: number) => void;
  onValidatePriceFloor: (cartId: string) => void;
  priceWarning: string | null;
  clienteNombre: string;
  setClienteNombre: (val: string) => void;
  clienteTelefono: string;
  setClienteTelefono: (val: string) => void;
  clienteCiNit: string;
  setClienteCiNit: (val: string) => void;
  metodoPagoCodigo: 'EFECTIVO' | 'QR_SIMPLE' | 'TRANSFERENCIA' | 'MIXTO';
  setMetodoPagoCodigo: (val: 'EFECTIVO' | 'QR_SIMPLE' | 'TRANSFERENCIA' | 'MIXTO') => void;
  montoRecibidoBs: number | '';
  setMontoRecibidoBs: (val: number | '') => void;
  montoEfectivoMixtoBs?: number | '';
  setMontoEfectivoMixtoBs?: (val: number | '') => void;
  comprobanteRef: string;
  setComprobanteRef: (val: string) => void;
  configuracion: any;
  onOpenModalQr: () => void;
  saleError: string | null;
  isSubmittingSale: boolean;
  onProcessCheckout: () => void;
}

export function PosCartPanel({
  cart,
  totalBs,
  onClearCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onUpdatePrice,
  onValidatePriceFloor,
  priceWarning,
  clienteNombre,
  setClienteNombre,
  clienteTelefono,
  setClienteTelefono,
  clienteCiNit,
  setClienteCiNit,
  metodoPagoCodigo,
  setMetodoPagoCodigo,
  montoRecibidoBs,
  setMontoRecibidoBs,
  montoEfectivoMixtoBs = '',
  setMontoEfectivoMixtoBs,
  comprobanteRef,
  setComprobanteRef,
  configuracion,
  onOpenModalQr,
  saleError,
  isSubmittingSale,
  onProcessCheckout,
}: PosCartPanelProps) {
  // Validación de cobro en efectivo: no permitir completar si entregó menos del total
  const isCashInsufficient =
    metodoPagoCodigo === 'EFECTIVO' &&
    typeof montoRecibidoBs === 'number' &&
    montoRecibidoBs > 0 &&
    montoRecibidoBs < totalBs;

  // En pago mixto, calcular saldo restante a transferir por QR
  const saldoQrBs =
    metodoPagoCodigo === 'MIXTO' && typeof montoEfectivoMixtoBs === 'number'
      ? Math.max(0, totalBs - montoEfectivoMixtoBs)
      : totalBs;

  return (
    <Card className="border-slate-200 shadow-card flex flex-col h-full max-h-[calc(100vh-6.5rem)] md:max-h-[calc(100vh-6.5rem)] overflow-hidden bg-white">
      {/* 1. CABECERA FIJA SUPERIOR (shrink-0) */}
      <CardHeader className="shrink-0 p-3.5 pb-2.5 border-b border-slate-100 bg-white z-10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-slate-800" />
          <CardTitle className="text-sm font-bold text-slate-900">
            Ticket de Venta
          </CardTitle>
          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
            title="Vaciar todos los productos del ticket"
          >
            Vaciar Ticket
          </button>
        )}
      </CardHeader>

      {/* 2. CUERPO CENTRAL CON SCROLL INDEPENDIENTE (flex-1 overflow-y-auto min-h-0) */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3.5 space-y-3.5">
        {/* Lista de Items en Carrito */}
        {cart.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-medium space-y-1">
            <p className="font-semibold text-slate-700">El carrito está vacío</p>
            <p className="text-[11px]">Escanea o selecciona teléfonos y accesorios para cobrar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div
                key={item.cartId}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between gap-2 transition-colors hover:bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {item.nombre}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {item.subtitulo}
                  </p>
                  {item.imei ? (
                    (() => {
                      const { prefix, terminal } = getImeiTerminalParts(item.imei);
                      return (
                        <p className="font-mono text-[9px] text-slate-600 font-medium select-all mt-0.5">
                          <span className="text-slate-400 mr-1">IMEI</span>
                          {prefix}
                          <strong className="font-bold text-slate-900 bg-white px-1 py-0.2 rounded border border-slate-200">
                            {terminal}
                          </strong>
                        </p>
                      );
                    })()
                  ) : item.serie ? (
                    <p className="font-mono text-[9px] text-slate-600 font-medium select-all mt-0.5">
                      <span className="text-slate-400 mr-1">S/N</span>
                      <strong className="font-bold text-slate-800">{item.serie}</strong>
                    </p>
                  ) : null}
                </div>

                {/* Control de Cantidad para Accesorios */}
                {item.tipo === 'ACCESORIO' ? (
                  <div className="flex items-center border border-slate-200 bg-white rounded-lg shadow-subtle shrink-0">
                    <button
                      type="button"
                      aria-label={`Disminuir cantidad de ${item.nombre}`}
                      onClick={() => onUpdateQuantity(item.cartId, -1)}
                      className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center hover:bg-slate-100 text-slate-700 active:scale-95 transition-transform rounded-l focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-2 font-mono font-bold text-[11px]" aria-live="polite">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      aria-label={`Aumentar cantidad de ${item.nombre}`}
                      onClick={() => onUpdateQuantity(item.cartId, 1)}
                      className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center hover:bg-slate-100 text-slate-700 active:scale-95 transition-transform rounded-r focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                    1 u.
                  </span>
                )}

                {/* Precio Unitario Editable con Bloqueo de Rueda de Ratón */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-[10px] text-slate-500 font-mono font-medium">Bs</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      aria-label={`Precio unitario acordado para ${item.nombre}`}
                      value={item.precioUnitarioBs || ''}
                      onChange={(e) => onUpdatePrice(item.cartId, parseFloat(e.target.value) || 0)}
                      onBlur={() => onValidatePriceFloor(item.cartId)}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      className="w-20 text-right font-mono font-bold text-slate-900 border border-slate-200 rounded px-1.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 bg-white"
                      title="Ajustar precio acordado"
                    />
                  </div>
                  {item.cantidad > 1 && (
                    <span className="font-mono text-[10px] text-slate-500 font-medium block mt-0.5">
                      Total: Bs {(item.cantidad * item.precioUnitarioBs).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Botón Eliminar */}
                <button
                  type="button"
                  aria-label={`Eliminar ${item.nombre} del carrito`}
                  onClick={() => onRemoveFromCart(item.cartId)}
                  className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Alerta Didáctica de Piso Comercial de Descuento */}
        {priceWarning && (
          <div
            role="alert"
            className="p-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs flex items-start gap-2 animate-in fade-in"
          >
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{priceWarning}</span>
          </div>
        )}

        {/* Datos Obligatorios del Comprador (Garantía) */}
        <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-700" />
              Datos del Comprador <span className="text-rose-600 font-bold">*</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setClienteNombre('Comprador casual');
                  setClienteTelefono('71000000');
                }}
                className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                title="Auto-completar datos para venta rápida de mostrador"
              >
                + Comprador casual
              </button>
              <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                Garantía
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              id="clienteNombre"
              aria-label="Nombre completo y apellidos del comprador"
              placeholder="Nombre completo y apellidos *"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="text-xs bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="clienteTelefono"
                aria-label="Teléfono o WhatsApp del comprador"
                placeholder="Teléfono / WhatsApp *"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                className="text-xs bg-white"
              />
              <Input
                id="clienteCiNit"
                aria-label="C.I. o NIT del comprador"
                placeholder="C.I. / NIT"
                value={clienteCiNit}
                onChange={(e) => setClienteCiNit(e.target.value)}
                className="text-xs bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. PIE DE PÁGINA PEGADO AL FONDO (STICKY BOTTOM SUMMARY) (shrink-0) */}
      <div className="shrink-0 border-t border-slate-200 bg-slate-50/95 backdrop-blur-sm p-3.5 space-y-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-10 max-h-[48vh] overflow-y-auto">
        {/* Selector de Método de Cobro (Efectivo / QR / Mixto) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Método de Cobro
            </span>
            {metodoPagoCodigo === 'MIXTO' && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                Efectivo + QR
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setMetodoPagoCodigo('EFECTIVO')}
              className={cn(
                'p-2 rounded-lg border text-left flex items-center justify-between transition-colors text-[11px]',
                metodoPagoCodigo === 'EFECTIVO'
                  ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <span>Efectivo</span>
              <Banknote className="h-3.5 w-3.5 shrink-0 ml-1" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMetodoPagoCodigo('QR_SIMPLE');
                onOpenModalQr();
              }}
              className={cn(
                'p-2 rounded-lg border text-left flex items-center justify-between transition-colors text-[11px]',
                metodoPagoCodigo === 'QR_SIMPLE'
                  ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <span>QR BCP</span>
              <QrCode className="h-3.5 w-3.5 shrink-0 ml-1" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMetodoPagoCodigo('MIXTO');
              }}
              className={cn(
                'p-2 rounded-lg border text-left flex items-center justify-between transition-colors text-[11px]',
                metodoPagoCodigo === 'MIXTO'
                  ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <span>Mixto</span>
              <Layers className="h-3.5 w-3.5 shrink-0 ml-1" />
            </button>
          </div>

          {/* 3.1. Calculadora de Efectivo y Vuelto (Modo EFECTIVO) */}
          {metodoPagoCodigo === 'EFECTIVO' && cart.length > 0 && (
            <div className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-800">
                  Efectivo Recibido en Gaveta
                </span>
                <span className="text-slate-500 font-mono">
                  Total: Bs {totalBs.toFixed(2)}
                </span>
              </div>

              {/* Botones de Billetes Rápidos */}
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setMontoRecibidoBs(totalBs)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-800 transition-colors border border-slate-200 active:scale-95"
                >
                  Exacto (Bs {totalBs.toFixed(2)})
                </button>
                {[20, 50, 100, 200].map((billete) => (
                  <button
                    key={billete}
                    type="button"
                    onClick={() => setMontoRecibidoBs(billete)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-800 transition-colors border border-slate-200 font-mono active:scale-95"
                  >
                    Bs {billete}
                  </button>
                ))}
              </div>

              {/* Input de Monto con Límite de Seguridad Anti-Desborde */}
              <Input
                type="number"
                step="0.50"
                min="0"
                max={totalBs * 10}
                placeholder="Ingresa monto entregado por el cliente..."
                value={montoRecibidoBs || ''}
                onChange={(e) => setMontoRecibidoBs(parseFloat(e.target.value) || '')}
                className="bg-white text-xs font-mono font-bold h-9"
              />

              {/* Visualización del Vuelto / Faltante */}
              {typeof montoRecibidoBs === 'number' && montoRecibidoBs > 0 && (
                <div
                  className={cn(
                    'p-2 rounded-lg border flex items-center justify-between font-mono text-xs transition-colors',
                    montoRecibidoBs >= totalBs
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  )}
                >
                  <span className="font-semibold font-sans text-[11px]">
                    {montoRecibidoBs >= totalBs ? 'Vuelto a Entregar:' : 'Monto Faltante:'}
                  </span>
                  <span className="text-sm font-bold">
                    {montoRecibidoBs >= totalBs
                      ? `Bs ${(montoRecibidoBs - totalBs).toFixed(2)}`
                      : `Faltan Bs ${(totalBs - montoRecibidoBs).toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3.2. Proyección de QR Simple Oficial (Modo QR_SIMPLE) */}
          {metodoPagoCodigo === 'QR_SIMPLE' && (
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Referencia Bancaria Requerida
                </span>
                <button
                  type="button"
                  onClick={onOpenModalQr}
                  className="text-slate-900 font-medium underline text-[11px] hover:text-black flex items-center gap-1"
                >
                  <QrCode className="h-3 w-3" />
                  Split Mode QR
                </button>
              </div>

              {configuracion?.qrOficialImagenUrl && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={onOpenModalQr}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenModalQr();
                    }
                  }}
                  className="cursor-pointer group bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-2.5 hover:border-slate-400 transition-colors shadow-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                >
                  <img
                    src={configuracion.qrOficialImagenUrl}
                    alt="QR Oficial CentralPhone"
                    className="w-12 h-12 object-contain rounded border border-slate-200 flex-shrink-0 bg-white"
                  />
                  <div className="text-[11px] leading-tight flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {configuracion?.bancoOficial || 'Banco de Crédito BCP'}
                    </p>
                    <p className="text-slate-500 font-mono text-[10px] truncate">
                      Cta: {configuracion?.numeroCuenta || 'N/A'}
                    </p>
                    <span className="text-[10px] text-blue-600 underline font-medium inline-block">
                      Proyectar al cliente en Split Mode
                    </span>
                  </div>
                </div>
              )}

              <Input
                placeholder="Ej: Nro. Comprobante BCP / 8 dígitos *"
                value={comprobanteRef}
                onChange={(e) => setComprobanteRef(e.target.value)}
                className="bg-white text-xs h-9 font-mono"
              />
            </div>
          )}

          {/* 3.3. Pago Mixto (Efectivo + QR) */}
          {metodoPagoCodigo === 'MIXTO' && (
            <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-900">
                  Desglose Mixto de Pago
                </span>
                <button
                  type="button"
                  onClick={onOpenModalQr}
                  className="text-blue-700 font-semibold underline text-[11px] hover:text-blue-900 flex items-center gap-1"
                >
                  <QrCode className="h-3 w-3" />
                  Ver QR de Saldo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                    Anticipo Efectivo (Bs)
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max={totalBs}
                    placeholder="Bs en gaveta..."
                    value={montoEfectivoMixtoBs || ''}
                    onChange={(e) =>
                      setMontoEfectivoMixtoBs &&
                      setMontoEfectivoMixtoBs(parseFloat(e.target.value) || '')
                    }
                    className="bg-white text-xs font-mono font-bold h-8"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                    Saldo Digital QR (Bs)
                  </label>
                  <div className="h-8 px-2 rounded-md border border-slate-200 bg-white font-mono font-bold text-xs flex items-center text-emerald-700">
                    Bs {saldoQrBs.toFixed(2)}
                  </div>
                </div>
              </div>

              <Input
                placeholder="Nro. Comprobante QR bancario *"
                value={comprobanteRef}
                onChange={(e) => setComprobanteRef(e.target.value)}
                className="bg-white text-xs h-8 font-mono"
              />
            </div>
          )}
        </div>

        {/* Mensaje de Error de Validación / Venta */}
        {saleError && (
          <div
            role="alert"
            className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{saleError}</span>
          </div>
        )}

        {/* Barra de Total y Botón de Finalización Inamovible */}
        <div className="pt-1 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total a Cobrar:
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              Bs {totalBs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <Button
            className="w-full text-sm font-semibold h-11 transition-all"
            disabled={cart.length === 0 || isCashInsufficient || isSubmittingSale}
            isLoading={isSubmittingSale}
            loadingText="Procesando venta e inventario..."
            onClick={onProcessCheckout}
          >
            <Banknote className="mr-2 h-4 w-4" />
            Finalizar Venta e Imprimir (F12)
          </Button>
        </div>
      </div>
    </Card>
  );
}
