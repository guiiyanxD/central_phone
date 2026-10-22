'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Unlock, Smartphone, Headphones } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { playScanBeep, playSaleSuccessSound } from '@/lib/sound';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';

import { CartItem } from '@/features/pos/types';
import { PosHeader } from '@/features/pos/components/pos-header';
import { PosCatalogPhones } from '@/features/pos/components/pos-catalog-phones';
import { PosCatalogAccessories } from '@/features/pos/components/pos-catalog-accessories';
import { PosCartPanel } from '@/features/pos/components/pos-cart-panel';
import { ModalQrOficial } from '@/features/pos/components/modal-qr-oficial';
import { ModalTicketVenta } from '@/features/pos/components/modal-ticket-venta';
import { printReceipt } from '@/features/pos/utils/receipt-printer';

export default function PosPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  // Helper de cálculo unificado de precio sugerido
  const getPhoneDisplayPrice = (disp: any): number => {
    return Number(disp.precioVentaSugeridoBs) > 0
      ? Number(disp.precioVentaSugeridoBs)
      : Math.round(Number(disp.costoBs || 0) * 1.15);
  };

  // Estados de sesión de caja
  const [sessionData, setSessionData] = useState<any | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Catálogo disponible para venta
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [accesorios, setAccesorios] = useState<any[]>([]);
  const [configuracion, setConfiguracion] = useState<any | null>(null);

  // Filtros de búsqueda
  const [searchPhone, setSearchPhone] = useState('');
  const [searchAccessory, setSearchAccessory] = useState('');
  const [catalogTab, setCatalogTab] = useState<'telefonos' | 'accesorios'>('telefonos');

  // Carrito de compras y datos de comprador
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteCiNit, setClienteCiNit] = useState('');

  // Método de pago y checkout
  const [metodoPagoCodigo, setMetodoPagoCodigo] = useState<'EFECTIVO' | 'QR_SIMPLE' | 'TRANSFERENCIA'>('EFECTIVO');
  const [comprobanteRef, setComprobanteRef] = useState('');
  const [montoRecibidoBs, setMontoRecibidoBs] = useState<number | ''>('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  // Ergonomía, hardware y feedback
  const inputSearchRef = useRef<HTMLInputElement>(null);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [lastRemovedItem, setLastRemovedItem] = useState<CartItem | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [modalQrOpen, setModalQrOpen] = useState(false);

  // Carga de datos
  const loadData = async () => {
    setIsLoadingSession(true);
    try {
      const [cajaRes, dispRes, accRes, configRes] = await Promise.all([
        api.caja.getActiva(),
        api.modelos.getDispositivos({ estado: 'DISPONIBLE', limit: 100 }),
        api.accesorios.getAll(),
        api.configuracion.get(),
      ]);
      setSessionData(cajaRes);
      setDispositivos(Array.isArray(dispRes) ? dispRes : (dispRes?.data || []));
      setAccesorios(accRes);
      setConfiguracion(configRes);
    } catch {
      // Manejar error silenciosamente
    } finally {
      setIsLoadingSession(false);
    }
  };

  const silentRefresh = async () => {
    try {
      const [cajaRes, dispRes, accRes] = await Promise.all([
        api.caja.getActiva(),
        api.modelos.getDispositivos({ estado: 'DISPONIBLE', limit: 100 }),
        api.accesorios.getAll(),
      ]);
      setSessionData(cajaRes);
      setDispositivos(Array.isArray(dispRes) ? dispRes : (dispRes?.data || []));
      setAccesorios(accRes);
    } catch {
      // Silencioso
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Atajos globales de teclado en mostrador (F2, F4, F8, F9, Ctrl+Z)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (modalQrOpen || completedSale) return;

      if (e.key === 'F2') {
        e.preventDefault();
        setCatalogTab('telefonos');
        setTimeout(() => inputSearchRef.current?.focus(), 50);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setCatalogTab((t) => (t === 'telefonos' ? 'accesorios' : 'telefonos'));
      } else if (e.key === 'F8') {
        e.preventDefault();
        setMetodoPagoCodigo('EFECTIVO');
      } else if (e.key === 'F9') {
        e.preventDefault();
        setMetodoPagoCodigo('QR_SIMPLE');
        setModalQrOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (lastRemovedItem) {
          e.preventDefault();
          handleUndoRemove();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [modalQrOpen, completedSale, lastRemovedItem]);

  // Manejadores de Carrito
  const handleAddPhoneToCart = (disp: any) => {
    if (cart.some((item) => item.dispositivoId === disp.id)) return;
    const precioSugerido = getPhoneDisplayPrice(disp);

    const newItem: CartItem = {
      cartId: `tel-${disp.id}`,
      tipo: 'DISPOSITIVO',
      dispositivoId: disp.id,
      nombre: disp.variante?.modelo?.nombreModelo,
      subtitulo: `${disp.variante?.color} • ${
        disp.variante?.capacidadGb > 0
          ? disp.variante?.capacidadGb >= 1024
            ? `${disp.variante?.capacidadGb / 1024}TB`
            : `${disp.variante?.capacidadGb}GB`
          : '0 GB'
      } [${disp.condicion}]`,
      imei: disp.imei1 || undefined,
      serie: disp.numeroSerie,
      cantidad: 1,
      precioUnitarioBs: precioSugerido,
      precioSugeridoOriginal: precioSugerido,
    };

    setCart((prev) => [...prev, newItem]);
    playScanBeep();
  };

  const handleAddAccessoryToCart = (acc: any, lote: any) => {
    const existing = cart.find((item) => item.loteAccesorioId === lote.id);
    if (existing) {
      if (existing.cantidad < lote.stockActual) {
        setCart(
          cart.map((item) =>
            item.loteAccesorioId === lote.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          )
        );
      }
    } else {
      const newItem: CartItem = {
        cartId: `acc-${lote.id}`,
        tipo: 'ACCESORIO',
        loteAccesorioId: lote.id,
        nombre: acc.nombre,
        subtitulo: lote.nombreDiferenciador,
        stockMaximo: lote.stockActual,
        cantidad: 1,
        precioUnitarioBs: Number(lote.precioVentaBs),
        precioSugeridoOriginal: Number(lote.precioVentaBs),
      };
      setCart((prev) => [...prev, newItem]);
    }
    playScanBeep();
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.cartId === cartId) {
            const nuevaCant = item.cantidad + delta;
            if (nuevaCant <= 0) return null;
            if (item.stockMaximo && nuevaCant > item.stockMaximo) return item;
            return { ...item, cantidad: nuevaCant };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleUpdatePrice = (cartId: string, newPrice: number) => {
    setPriceWarning(null);
    setCart(
      cart.map((item) =>
        item.cartId === cartId ? { ...item, precioUnitarioBs: newPrice } : item
      )
    );
  };

  const handleValidatePriceFloor = (cartId: string) => {
    setPriceWarning(null);
    const item = cart.find((i) => i.cartId === cartId);
    if (!item) return;

    if (user?.rol !== 'ADMIN' && item.precioSugeridoOriginal && item.precioSugeridoOriginal > 0) {
      const pisoMinimo = Math.round(item.precioSugeridoOriginal * 0.9);
      if (item.precioUnitarioBs < pisoMinimo) {
        setPriceWarning(
          `Política Comercial: Como vendedor no puedes reducir el precio de "${item.nombre}" por debajo de Bs ${pisoMinimo.toFixed(2)} (máx 10% de descuento). Se ha reajustado al piso permitido.`
        );
        setCart(
          cart.map((i) => (i.cartId === cartId ? { ...i, precioUnitarioBs: pisoMinimo } : i))
        );
      }
    }
  };

  const handleRemoveFromCart = (cartId: string) => {
    const itemToRemove = cart.find((item) => item.cartId === cartId);
    if (!itemToRemove) return;

    setCart(cart.filter((item) => item.cartId !== cartId));
    setLastRemovedItem(itemToRemove);
    setUndoToastVisible(true);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setUndoToastVisible(false);
      setLastRemovedItem(null);
    }, 5000);
  };

  const handleUndoRemove = () => {
    if (!lastRemovedItem) return;
    setCart((prev) => [...prev, lastRemovedItem]);
    setUndoToastVisible(false);
    setLastRemovedItem(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('¿Deseas descartar y vaciar todos los productos del ticket actual?')) {
      setCart([]);
      setMontoRecibidoBs('');
      setPriceWarning(null);
      setUndoToastVisible(false);
      setLastRemovedItem(null);
    }
  };

  // Filtrado optimizado de teléfonos y accesorios con useMemo (FRONT-P0-03)
  const filteredPhones = useMemo(() => {
    if (!searchPhone.trim()) return dispositivos;
    const q = searchPhone.toLowerCase();
    return dispositivos.filter((d) => {
      return (
        (d.imei1 && d.imei1.toLowerCase().includes(q)) ||
        (d.numeroSerie && d.numeroSerie.toLowerCase().includes(q)) ||
        (d.variante?.modelo?.nombreModelo && d.variante.modelo.nombreModelo.toLowerCase().includes(q)) ||
        (d.variante?.color && d.variante.color.toLowerCase().includes(q))
      );
    });
  }, [dispositivos, searchPhone]);

  const filteredAccessories = useMemo(() => {
    const q = searchAccessory.toLowerCase().trim();
    return accesorios.flatMap((acc) => {
      const matchingLotes = (acc.lotes || []).filter((lote: any) => {
        if (!q) return true;
        return (
          acc.nombre.toLowerCase().includes(q) ||
          (lote.nombreDiferenciador && lote.nombreDiferenciador.toLowerCase().includes(q))
        );
      });
      return matchingLotes.map((lote: any) => ({ acc, lote }));
    });
  }, [accesorios, searchAccessory]);

  // Hook Global de Hardware (useBarcodeScanner): Escaneo de IMEI o Serie desacoplado del cursor
  useBarcodeScanner({
    onScan: (scannedCode) => {
      const q = scannedCode.toLowerCase().trim();
      const match = dispositivos.find(
        (d) =>
          (d.imei1 && d.imei1.toLowerCase() === q) ||
          (d.imei2 && d.imei2.toLowerCase() === q) ||
          (d.numeroSerie && d.numeroSerie.toLowerCase() === q)
      );

      if (match) {
        if (cart.some((i) => i.dispositivoId === match.id)) {
          setScanFeedback(`El equipo (${match.imei1 || match.numeroSerie}) ya está en el ticket.`);
        } else {
          handleAddPhoneToCart(match);
          setScanFeedback(`✓ Escaneado: ${match.variante?.modelo?.nombreModelo} (${match.imei1 || match.numeroSerie})`);
        }
        setTimeout(() => setScanFeedback(null), 3000);
      }
    },
    enabled: !modalQrOpen && !completedSale,
  });

  // Manejador del input de búsqueda con Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchPhone.trim().toLowerCase();
      if (!q) return;

      const exactMatch = dispositivos.find(
        (d) =>
          (d.imei1 && d.imei1.toLowerCase() === q) ||
          (d.imei2 && d.imei2.toLowerCase() === q) ||
          (d.numeroSerie && d.numeroSerie.toLowerCase() === q)
      );

      if (exactMatch) {
        if (cart.some((i) => i.dispositivoId === exactMatch.id)) {
          setScanFeedback(`El equipo (${exactMatch.imei1 || exactMatch.numeroSerie}) ya está en el ticket.`);
        } else {
          handleAddPhoneToCart(exactMatch);
          setScanFeedback(`✓ Escaneado: ${exactMatch.variante?.modelo?.nombreModelo} (${exactMatch.imei1 || exactMatch.numeroSerie})`);
          setSearchPhone('');
        }
        setTimeout(() => setScanFeedback(null), 3000);
        return;
      }

      if (filteredPhones.length === 1) {
        const single = filteredPhones[0];
        if (cart.some((i) => i.dispositivoId === single.id)) {
          setScanFeedback(`El equipo ya está en el ticket.`);
        } else {
          handleAddPhoneToCart(single);
          setScanFeedback(`✓ Agregado: ${single.variante?.modelo?.nombreModelo} (${single.imei1 || single.numeroSerie})`);
          setSearchPhone('');
        }
        setTimeout(() => setScanFeedback(null), 3000);
      }
    }
  };

  // Cálculo del total
  const totalBs = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.cantidad * item.precioUnitarioBs, 0);
  }, [cart]);

  // Checkout y Confirmación
  const handleProcessCheckout = async () => {
    if (cart.length === 0) return;
    setSaleError(null);

    if (!clienteNombre.trim()) {
      setSaleError('El nombre completo del cliente es obligatorio para registrar la venta y emitir la garantía.');
      return;
    }

    if (!clienteTelefono.trim()) {
      setSaleError('El teléfono de contacto del cliente es obligatorio para el registro de garantía y contacto.');
      return;
    }

    if (
      (metodoPagoCodigo === 'QR_SIMPLE' || metodoPagoCodigo === 'TRANSFERENCIA') &&
      (!comprobanteRef || comprobanteRef.trim().length === 0)
    ) {
      setSaleError('Es obligatorio ingresar el número de referencia bancaria o comprobante para pagos por QR.');
      return;
    }

    setIsSubmittingSale(true);

    try {
      const payload = {
        metodoPagoCodigo,
        comprobanteReferencia: comprobanteRef.trim() || undefined,
        cliente: {
          nombreCompleto: clienteNombre.trim(),
          telefono: clienteTelefono.trim(),
          ciNit: clienteCiNit.trim() || undefined,
        },
        dispositivos: cart
          .filter((i) => i.tipo === 'DISPOSITIVO')
          .map((i) => ({
            dispositivoId: i.dispositivoId!,
            precioVentaBs: i.precioUnitarioBs,
          })),
        accesorios: cart
          .filter((i) => i.tipo === 'ACCESORIO')
          .map((i) => ({
            loteAccesorioId: i.loteAccesorioId!,
            cantidad: i.cantidad,
            precioVentaBs: i.precioUnitarioBs,
          })),
      };

      const res = await api.ventas.create(payload);
      playSaleSuccessSound();
      setCompletedSale(res);
      setCart([]);
      setClienteNombre('');
      setClienteTelefono('');
      setClienteCiNit('');
      setComprobanteRef('');
      setMontoRecibidoBs('');
      await silentRefresh();
    } catch (err: any) {
      setSaleError(err.message || 'Error al procesar la venta.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // ALERTA OBLIGATORIA: Si no hay caja abierta, bloquear POS (Invariante 7)
  if (!sessionData?.caja) {
    return (
      <div className="max-w-md mx-auto py-16 animate-in fade-in duration-200">
        <Card className="border-slate-200 bg-white p-8 text-center space-y-4 shadow-subtle">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
            <Unlock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Terminal de Venta Bloqueado
            </h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Por regla inmutable de seguridad y cuadre financiero, no puedes procesar ventas en mostrador sin antes abrir la caja de {user?.sucursal?.nombre || 'la sucursal'}.
            </p>
          </div>
          <Link href="/caja">
            <Button className="w-full mt-2">
              <Unlock className="mr-2 h-4 w-4" />
              Abrir Caja Ahora
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Encabezado POS */}
      <PosHeader
        sessionData={sessionData}
        user={user}
        isAdmin={isAdmin}
      />

      {/* Grid Principal POS: 7 columnas catálogo / 5 columnas carrito */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* PANEL IZQUIERDO: CATÁLOGO Y BUSCADOR DE PRODUCTOS (7 COLUMNAS) */}
        <div className="md:col-span-7 space-y-4">
          <Tabs
            value={catalogTab}
            onValueChange={(val) => setCatalogTab(val as 'telefonos' | 'accesorios')}
          >
            <TabsList variant="line" className="w-full justify-start pb-2 mb-2">
              <TabsTrigger value="telefonos" variant="line">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Teléfonos Disponibles ({filteredPhones.length})</span>
              </TabsTrigger>
              <TabsTrigger value="accesorios" variant="line">
                <Headphones className="h-3.5 w-3.5" />
                <span>Lotes de Accesorios</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {catalogTab === 'telefonos' ? (
            <PosCatalogPhones
              searchPhone={searchPhone}
              setSearchPhone={setSearchPhone}
              filteredPhones={filteredPhones}
              cart={cart}
              scanFeedback={scanFeedback}
              inputSearchRef={inputSearchRef}
              onSearchKeyDown={handleSearchKeyDown}
              onAddPhone={handleAddPhoneToCart}
              getPhoneDisplayPrice={getPhoneDisplayPrice}
            />
          ) : (
            <PosCatalogAccessories
              searchAccessory={searchAccessory}
              setSearchAccessory={setSearchAccessory}
              filteredAccessories={filteredAccessories}
              onAddAccessory={handleAddAccessoryToCart}
            />
          )}
        </div>

        {/* PANEL DERECHO: CARRITO & CHECKOUT (5 COLUMNAS) */}
        <div className="md:col-span-5">
          <PosCartPanel
            cart={cart}
            totalBs={totalBs}
            onClearCart={handleClearCart}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdatePrice={handleUpdatePrice}
            onValidatePriceFloor={handleValidatePriceFloor}
            priceWarning={priceWarning}
            clienteNombre={clienteNombre}
            setClienteNombre={setClienteNombre}
            clienteTelefono={clienteTelefono}
            setClienteTelefono={setClienteTelefono}
            clienteCiNit={clienteCiNit}
            setClienteCiNit={setClienteCiNit}
            metodoPagoCodigo={metodoPagoCodigo}
            setMetodoPagoCodigo={setMetodoPagoCodigo}
            montoRecibidoBs={montoRecibidoBs}
            setMontoRecibidoBs={setMontoRecibidoBs}
            comprobanteRef={comprobanteRef}
            setComprobanteRef={setComprobanteRef}
            configuracion={configuracion}
            onOpenModalQr={() => setModalQrOpen(true)}
            saleError={saleError}
            isSubmittingSale={isSubmittingSale}
            onProcessCheckout={handleProcessCheckout}
          />
        </div>
      </div>

      {/* Modal QR Oficial */}
      <ModalQrOficial
        isOpen={modalQrOpen}
        onClose={() => setModalQrOpen(false)}
        configuracion={configuracion}
        totalBs={totalBs}
      />

      {/* Modal Ticket de Venta */}
      <ModalTicketVenta
        sale={completedSale}
        onClose={() => setCompletedSale(null)}
        onPrintReceipt={() => printReceipt(completedSale)}
      />

      {/* Toast Flotante de Deshacer Eliminación */}
      {undoToastVisible && lastRemovedItem && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-5 duration-200"
        >
          <span className="text-xs">
            Se eliminó <strong className="font-semibold text-slate-100">{lastRemovedItem.nombre}</strong>
          </span>
          <button
            type="button"
            onClick={handleUndoRemove}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded px-1 py-0.5"
          >
            Deshacer (Ctrl+Z)
          </button>
        </div>
      )}
    </div>
  );
}
