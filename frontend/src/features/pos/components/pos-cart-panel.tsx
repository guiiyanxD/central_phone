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
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CartItem } from '../types';
import { getImeiTerminalParts } from '../utils/formatters';
import { PermutaTradeInDto } from '@/lib/api/ventas.api';

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
  permutaTradeIn?: PermutaTradeInDto | null;
  permutaSummary?: {
    modeloNombre: string;
    varianteDetalle: string;
    imei1: string;
    valorTomaBs: number;
  } | null;
  onOpenModalPermuta?: () => void;
  onRemovePermuta?: () => void;
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
  permutaTradeIn,
  permutaSummary,
  onOpenModalPermuta,
  onRemovePermuta,
}: PosCartPanelProps) {
  const montoPermuta = permutaTradeIn?.valorTomaBs || 0;
  const saldoACobrar = Math.max(0, totalBs - montoPermuta);

  // Validación estricta de cobro en efectivo (ID-POS-002):
  // Si hay saldo a cobrar, es obligatorio ingresar el monto entregado y que cubra el total.
  const isCashInsufficient =
    saldoACobrar > 0 &&
    metodoPagoCodigo === 'EFECTIVO' &&
    (typeof montoRecibidoBs !== 'number' || montoRecibidoBs < saldoACobrar);

  // En pago mixto, calcular saldo restante a transferir por QR
  const saldoQrBs =
    metodoPagoCodigo === 'MIXTO' && typeof montoEfectivoMixtoBs === 'number'
      ? Math.max(0, saldoACobrar - montoEfectivoMixtoBs)
      : saldoACobrar;

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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-slate-900 truncate">
                      {item.nombre}
                    </p>
                    {item.isInterSucursal && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded border bg-amber-50 text-amber-800 border-amber-300 shrink-0">
                        De: {item.sucursalNombre || `Sucursal #${item.sucursalId}`}
                      </span>
                    )}
                  </div>
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
              <span>Datos del Comprador</span>
              <span className="text-rose-600 font-bold">*</span>
              <kbd className="hidden sm:inline-block text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded border border-slate-200" title="Atajo F3 para enfocar comprador">
                F3
              </kbd>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setClienteNombre('Comprador casual');
                  setClienteTelefono('71000000');
                }}
                className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors flex items-center gap-1"
                title="Auto-completar datos para venta rápida de mostrador (Ctrl+Alt+C)"
              >
                <span>+ Comprador casual</span>
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
        {/* Sección de Permuta (Trade-In) */}
        {cart.length > 0 && (
          <div className="space-y-1.5">
            {!permutaTradeIn && onOpenModalPermuta ? (
              <button
                type="button"
                onClick={onOpenModalPermuta}
                className="w-full py-2 px-2.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                <span>Aplicar Permuta (Trade-In como crédito)</span>
              </button>
            ) : permutaTradeIn && permutaSummary ? (
              <div className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span className="text-[11px] font-bold text-emerald-900">
                      Permuta: {permutaSummary.modeloNombre}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-700">
                    - Bs {permutaTradeIn.valorTomaBs.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-800">
                  <span>
                    {permutaSummary.varianteDetalle} • IMEI: ...{permutaTradeIn.imei1.slice(-5)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onOpenModalPermuta && (
                      <button
                        type="button"
                        onClick={onOpenModalPermuta}
                        className="font-medium underline hover:text-emerald-950 px-1"
                      >
                        Editar
                      </button>
                    )}
                    {onRemovePermuta && (
                      <button
                        type="button"
                        onClick={onRemovePermuta}
                        className="font-medium text-rose-600 hover:text-rose-800 px-1"
                        title="Quitar permuta del ticket"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

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
                  {montoPermuta > 0 ? `Saldo: Bs ${saldoACobrar.toFixed(2)}` : `Total: Bs ${saldoACobrar.toFixed(2)}`}
                </span>
              </div>

              {/* Botones de Billetes Rápidos */}
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setMontoRecibidoBs(saldoACobrar)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-800 transition-colors border border-slate-200 active:scale-95"
                >
                  Exacto (Bs {saldoACobrar.toFixed(2)})
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
                max={Math.max(100, saldoACobrar * 10)}
                placeholder="Ingresa monto entregado por el cliente..."
                value={montoRecibidoBs || ''}
                onChange={(e) => setMontoRecibidoBs(parseFloat(e.target.value) || '')}
                className="bg-white text-xs font-mono font-bold h-9"
              />

              {/* Visualización del Vuelto / Faltante (ID-POS-005) */}
              {typeof montoRecibidoBs === 'number' && montoRecibidoBs > 0 && (
                <div
                  className={cn(
                    'p-2.5 rounded-xl border flex items-center justify-between font-mono transition-colors shadow-2xs',
                    montoRecibidoBs >= saldoACobrar
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  )}
                >
                  <span className="font-semibold font-sans text-xs">
                    {montoRecibidoBs >= saldoACobrar ? 'Cambio / Vuelto a Entregar:' : 'Monto Faltante:'}
                  </span>
                  <span
                    className={cn(
                      'font-mono tracking-tight',
                      montoRecibidoBs >= saldoACobrar
                        ? 'text-2xl font-black text-emerald-700'
                        : 'text-sm font-bold text-amber-800'
                    )}
                  >
                    {montoRecibidoBs >= saldoACobrar
                      ? `Bs ${(montoRecibidoBs - saldoACobrar).toFixed(2)}`
                      : `Faltan Bs ${(saldoACobrar - montoRecibidoBs).toFixed(2)}`}
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
                    max={saldoACobrar}
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
          {montoPermuta > 0 && (
            <div className="space-y-1 text-xs border-b border-slate-200 pb-2">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Items:</span>
                <span className="font-mono">Bs {totalBs.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700">
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Crédito Permuta:
                </span>
                <span className="font-mono">- Bs {montoPermuta.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {montoPermuta > 0 ? 'Saldo a Cobrar:' : 'Total a Cobrar:'}
            </span>
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              Bs {saldoACobrar.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            {saldoACobrar === 0
              ? 'Finalizar Venta (Cubierto 100% por Permuta) (Ctrl+↵)'
              : 'Finalizar Venta e Imprimir (Ctrl+↵)'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
