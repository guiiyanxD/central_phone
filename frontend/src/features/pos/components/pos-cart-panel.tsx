import React from 'react';
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  User,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CartItem } from '../types';

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
  metodoPagoCodigo: 'EFECTIVO' | 'QR_SIMPLE' | 'TRANSFERENCIA';
  setMetodoPagoCodigo: (val: 'EFECTIVO' | 'QR_SIMPLE' | 'TRANSFERENCIA') => void;
  montoRecibidoBs: number | '';
  setMontoRecibidoBs: (val: number | '') => void;
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
  comprobanteRef,
  setComprobanteRef,
  configuracion,
  onOpenModalQr,
  saleError,
  isSubmittingSale,
  onProcessCheckout,
}: PosCartPanelProps) {
  return (
    <Card className="border-slate-200 shadow-card">
      <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-slate-800" />
          <CardTitle className="text-sm font-bold text-slate-900">
            Ticket de Venta
          </CardTitle>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500 font-medium">
            {cart.length} productos
          </span>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline px-1.5 py-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
              title="Vaciar todos los productos del ticket"
            >
              Vaciar Ticket
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Lista de Items en Carrito */}
        {cart.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 font-medium">
            El carrito está vacío. Selecciona teléfonos o accesorios para cobrar.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={item.cartId}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {item.nombre}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {item.subtitulo}
                  </p>
                  {item.imei ? (
                    <p className="font-mono text-[9px] text-slate-600 font-medium">
                      IMEI: {item.imei}
                    </p>
                  ) : item.serie ? (
                    <p className="font-mono text-[9px] text-slate-600 font-medium">
                      S/N: {item.serie}
                    </p>
                  ) : null}
                </div>

                {/* Control de Cantidad */}
                {item.tipo === 'ACCESORIO' ? (
                  <div className="flex items-center border border-slate-200 bg-white rounded-lg shadow-sm">
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
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    1 u.
                  </span>
                )}

                {/* Precio Unitario Editable */}
                <div className="text-right">
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
                  className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {priceWarning && (
          <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{priceWarning}</span>
          </div>
        )}

        {/* Datos Obligatorios del Comprador */}
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
                title="Auto-completar datos para venta rápida de accesorios"
              >
                + Comprador casual
              </button>
              <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                Obligatorio para Garantía
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

        {/* Método de Pago */}
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <p className="text-xs font-semibold text-slate-800">
            Método de Cobro
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMetodoPagoCodigo('EFECTIVO')}
              className={cn(
                'p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors',
                metodoPagoCodigo === 'EFECTIVO'
                  ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <span>Efectivo</span>
              <CreditCard className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMetodoPagoCodigo('QR_SIMPLE');
                onOpenModalQr();
              }}
              className={cn(
                'p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors',
                metodoPagoCodigo === 'QR_SIMPLE'
                  ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <span>QR Oficial BCP</span>
              <QrCode className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Calculadora de Efectivo y Vuelto */}
          {metodoPagoCodigo === 'EFECTIVO' && cart.length > 0 && (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Efectivo Recibido en Gaveta
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Total: Bs {totalBs.toFixed(2)}
                </span>
              </div>

              {/* Botones de Billetes Rápidos */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setMontoRecibidoBs(totalBs)}
                  className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-slate-400 text-[11px] font-semibold text-slate-700 transition-colors shadow-subtle active:scale-95"
                >
                  Exacto (Bs {totalBs.toFixed(2)})
                </button>
                {[20, 50, 100, 200].map((billete) => (
                  <button
                    key={billete}
                    type="button"
                    onClick={() => setMontoRecibidoBs(billete)}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-slate-400 text-[11px] font-semibold text-slate-700 transition-colors shadow-subtle font-mono active:scale-95"
                  >
                    Bs {billete}
                  </button>
                ))}
              </div>

              {/* Input de Monto Recibido */}
              <Input
                type="number"
                step="0.50"
                min="0"
                placeholder="Ingresa monto entregado por el cliente..."
                value={montoRecibidoBs || ''}
                onChange={(e) => setMontoRecibidoBs(parseFloat(e.target.value) || '')}
                className="bg-white text-xs font-mono font-bold"
              />

              {/* Visualización Destacada del Vuelto */}
              {typeof montoRecibidoBs === 'number' && montoRecibidoBs > 0 && (
                <div
                  className={cn(
                    'p-2.5 rounded-lg border flex items-center justify-between font-mono text-xs transition-colors',
                    montoRecibidoBs >= totalBs
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  )}
                >
                  <span className="font-semibold font-sans">
                    {montoRecibidoBs >= totalBs ? 'Cambio / Vuelto a Entregar:' : 'Monto Faltante:'}
                  </span>
                  <span className="text-base font-bold">
                    {montoRecibidoBs >= totalBs
                      ? `Bs ${(montoRecibidoBs - totalBs).toFixed(2)}`
                      : `Faltan Bs ${(totalBs - montoRecibidoBs).toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Si elige QR, exigir referencia bancaria */}
          {metodoPagoCodigo === 'QR_SIMPLE' && (
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/80 space-y-3 text-xs animate-in fade-in">
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
                  Ampliar QR
                </button>
              </div>

              {configuracion?.qrOficialImagenUrl && (
                <div
                  onClick={onOpenModalQr}
                  className="cursor-pointer group bg-white border border-slate-200 rounded-lg p-2.5 flex items-center gap-3 hover:border-slate-400 transition-colors shadow-subtle"
                >
                  <img
                    src={configuracion.qrOficialImagenUrl}
                    alt="QR Oficial CentralPhone"
                    className="w-16 h-16 object-contain rounded border border-slate-100 flex-shrink-0"
                  />
                  <div className="text-[11px] leading-tight flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {configuracion?.bancoOficial || 'Banco de Crédito BCP'}
                    </p>
                    <p className="text-slate-500 font-mono text-[10px] mt-0.5 truncate">
                      Titular: {configuracion?.titularCuenta || 'CentralPhone'}
                    </p>
                    <p className="text-slate-500 font-mono text-[10px] truncate">
                      Cta: {configuracion?.numeroCuenta || 'N/A'}
                    </p>
                    <span className="text-[10px] text-slate-700 underline font-medium mt-1 inline-block">
                      Proyectar en pantalla completa
                    </span>
                  </div>
                </div>
              )}

              <Input
                placeholder="Ej: Nro. Comprobante BCP / 8 dígitos"
                value={comprobanteRef}
                onChange={(e) => setComprobanteRef(e.target.value)}
                className="bg-white text-xs"
              />
            </div>
          )}
        </div>

        {/* Mensaje de Error si hay */}
        {saleError && (
          <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{saleError}</span>
          </div>
        )}

        {/* Total y Botón de Finalización */}
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold text-slate-600">Total a Cobrar:</span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              Bs {totalBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <Button
            className="w-full text-sm font-semibold h-11"
            disabled={cart.length === 0}
            isLoading={isSubmittingSale}
            loadingText="Procesando cobro e inventario..."
            onClick={onProcessCheckout}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Finalizar Venta e Imprimir Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
