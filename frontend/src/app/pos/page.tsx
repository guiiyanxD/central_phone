'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { playScanBeep, playSaleSuccessSound } from '@/lib/sound';
import {
  CreditCard,
  Smartphone,
  Headphones,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Printer,
  Unlock,
  Building2,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface CartItem {
  cartId: string;
  tipo: 'DISPOSITIVO' | 'ACCESORIO';
  dispositivoId?: number;
  loteAccesorioId?: number;
  nombre: string;
  subtitulo: string;
  imei?: string;
  serie?: string;
  stockMaximo?: number;
  cantidad: number;
  precioUnitarioBs: number;
  precioSugeridoOriginal?: number;
}

export default function PosPage() {
  const { user } = useAuth();

  // Estados de sesión de caja
  const [sessionData, setSessionData] = useState<any | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Catálogo disponible para venta
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [accesorios, setAccesorios] = useState<any[]>([]);
  const [configuracion, setConfiguracion] = useState<any | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Filtros de búsqueda en mostrador
  const [searchPhone, setSearchPhone] = useState('');
  const [catalogTab, setCatalogTab] = useState<'telefonos' | 'accesorios'>('telefonos');

  // Carrito de compras
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteCiNit, setClienteCiNit] = useState('');

  // Método de pago y checkout
  const [metodoPagoCodigo, setMetodoPagoCodigo] = useState<'EFECTIVO' | 'QR_SIMPLE' | 'TRANSFERENCIA'>('EFECTIVO');
  const [comprobanteRef, setComprobanteRef] = useState('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  // Estados de ergonomía de mostrador y calculadora de vuelto (ID-POS-001, ID-UX-001)
  const inputSearchRef = useRef<HTMLInputElement>(null);
  const [montoRecibidoBs, setMontoRecibidoBs] = useState<number | ''>('');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Filtro de búsqueda rápida en accesorios (ID-UX-004)
  const [searchAccessory, setSearchAccessory] = useState('');

  // Patrón "Deshacer" para eliminación accidental en mostrador (ID-POS-003)
  const [lastRemovedItem, setLastRemovedItem] = useState<CartItem | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal QR Oficial
  const [modalQrOpen, setModalQrOpen] = useState(false);

  // Carga inicial de sesión y catálogo
  const loadData = async () => {
    setIsLoadingSession(true);
    setIsLoadingCatalog(true);
    try {
      const [cajaRes, dispRes, accRes, configRes] = await Promise.all([
        api.caja.getActiva(),
        api.modelos.getDispositivos({ estado: 'DISPONIBLE' }),
        api.accesorios.getAll(),
        api.configuracion.get(),
      ]);
      setSessionData(cajaRes);
      setDispositivos(dispRes);
      setAccesorios(accRes);
      setConfiguracion(configRes);
    } catch {
      // Manejar error silenciosamente
    } finally {
      setIsLoadingSession(false);
      setIsLoadingCatalog(false);
    }
  };

  // Revalidación silenciosa en segundo plano sin parpadeo de Skeletons (ID-MI-001)
  const silentRefresh = async () => {
    try {
      const [cajaRes, dispRes, accRes] = await Promise.all([
        api.caja.getActiva(),
        api.modelos.getDispositivos({ estado: 'DISPONIBLE' }),
        api.accesorios.getAll(),
      ]);
      setSessionData(cajaRes);
      setDispositivos(dispRes);
      setAccesorios(accRes);
    } catch {
      // Silencioso
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Autofocus en el buscador de IMEI al abrir POS o cerrar ticket completado (ID-POS-001)
  useEffect(() => {
    if (sessionData?.caja && !isLoadingSession && !completedSale && catalogTab === 'telefonos') {
      inputSearchRef.current?.focus();
    }
  }, [sessionData?.caja, isLoadingSession, completedSale, catalogTab]);

  // Atajos globales de teclado para cajero de mostrador (ID-POS-002, ID-POS-003)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (modalQrOpen || completedSale) return;

      if (e.key === 'F2') {
        e.preventDefault();
        setCatalogTab('telefonos');
        setTimeout(() => {
          inputSearchRef.current?.focus();
          inputSearchRef.current?.select();
        }, 50);
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
    // Si ya está en carrito, evitar duplicarlo
    if (cart.some((item) => item.dispositivoId === disp.id)) return;

    // Sugerir precio de venta oficial (US09 / Fase 2)
    const precioSugerido =
      Number(disp.precioVentaSugeridoBs) > 0
        ? Number(disp.precioVentaSugeridoBs)
        : Math.round(Number(disp.costoBs || 0) * 1.15);

    const newItem: CartItem = {
      cartId: `tel-${disp.id}`,
      tipo: 'DISPOSITIVO',
      dispositivoId: disp.id,
      nombre: disp.variante?.modelo?.nombreModelo,
      subtitulo: `${disp.variante?.color} • ${disp.variante?.capacidadGb >= 1024 ? `${disp.variante?.capacidadGb / 1024}TB` : `${disp.variante?.capacidadGb}GB`} [${disp.condicion}]`,
      imei: disp.imei1,
      serie: disp.numeroSerie,
      cantidad: 1,
      precioUnitarioBs: precioSugerido,
      precioSugeridoOriginal: precioSugerido,
    };

    setCart([...cart, newItem]);
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
      setCart([...cart, newItem]);
    }
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

    // Regla de negocio: si no es ADMIN, no puede reducir más del 10% del precio sugerido original (ID-UX-002)
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

  // Manejador del escáner de código de barras para teléfono (Enter directo sin mouse) (ID-POS-001)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchPhone.trim().toLowerCase();
      if (!q) return;

      // 1. Buscar coincidencia exacta por IMEI 1, IMEI 2 o Serie
      const exactMatch = dispositivos.find(
        (d) =>
          d.imei1.toLowerCase() === q ||
          (d.imei2 && d.imei2.toLowerCase() === q) ||
          d.numeroSerie.toLowerCase() === q
      );

      if (exactMatch) {
        if (cart.some((i) => i.dispositivoId === exactMatch.id)) {
          setScanFeedback(`El equipo (${exactMatch.imei1}) ya está en el ticket.`);
        } else {
          handleAddPhoneToCart(exactMatch);
          playScanBeep();
          setScanFeedback(`✓ Escaneado: ${exactMatch.variante?.modelo?.nombreModelo} (${exactMatch.imei1})`);
          setSearchPhone('');
        }
        setTimeout(() => setScanFeedback(null), 3000);
        return;
      }

      // 2. Si no hay match exacto pero el filtro arrojó 1 solo equipo
      if (filteredPhones.length === 1) {
        const single = filteredPhones[0];
        if (cart.some((i) => i.dispositivoId === single.id)) {
          setScanFeedback(`El equipo ya está en el ticket.`);
        } else {
          handleAddPhoneToCart(single);
          playScanBeep();
          setScanFeedback(`✓ Agregado: ${single.variante?.modelo?.nombreModelo} (${single.imei1})`);
          setSearchPhone('');
        }
        setTimeout(() => setScanFeedback(null), 3000);
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

  // Cálculos de Totales
  const totalBs = cart.reduce(
    (sum, item) => sum + item.cantidad * item.precioUnitarioBs,
    0
  );

  // Impresión aislada del Comprobante / Recibo Térmico (Solo el ticket, sin la página)
  const handlePrintReceipt = () => {
    if (!completedSale) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const fechaHora = new Date(completedSale.fechaHora).toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemsHtml =
      completedSale.detalles
        ?.map((det: any) => {
          const nombreItem =
            det.tipoItem === 'DISPOSITIVO'
              ? `${det.dispositivo?.variante?.modelo?.nombreModelo || 'iPhone'} (${det.dispositivo?.variante?.color || ''} ${det.dispositivo?.variante?.capacidadGb ? det.dispositivo.variante.capacidadGb + 'GB' : ''})`
              : `${det.loteAccesorio?.accesorio?.nombre || 'Accesorio'} [${det.loteAccesorio?.nombreDiferenciador || ''}]`;

          const imeiHtml = det.dispositivo
            ? `<div style="font-size:9px;color:#222;margin-top:1px;">IMEI 1: ${det.dispositivo.imei1}${det.dispositivo.imei2 ? '<br>IMEI 2: ' + det.dispositivo.imei2 : ''}<br>SERIE: ${det.dispositivo.numeroSerie}</div>`
            : '';

          const cantHtml =
            det.cantidad > 1
              ? `<div style="font-size:9px;color:#444;">${det.cantidad} unid. x Bs ${Number(det.precioUnitarioBs).toFixed(2)}</div>`
              : '';

          return `
            <tr>
              <td style="padding:4px 0;vertical-align:top;">
                <div style="font-weight:bold;">${nombreItem}</div>
                ${imeiHtml}
                ${cantHtml}
              </td>
              <td style="padding:4px 0;vertical-align:top;text-align:right;font-weight:bold;white-space:nowrap;">
                Bs ${Number(det.subtotalBs).toFixed(2)}
              </td>
            </tr>
          `;
        })
        .join('') || '';

    const clienteInfo = completedSale.cliente
      ? `
        <div style="display:flex;justify-content:space-between;margin:2px 0;">
          <span style="color:#555;">Cliente:</span>
          <span style="font-weight:bold;">${completedSale.cliente.nombreCompleto}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin:2px 0;">
          <span style="color:#555;">Teléfono:</span>
          <span style="font-weight:bold;">${completedSale.cliente.telefono}</span>
        </div>
        ${
          completedSale.cliente.ciNit
            ? `<div style="display:flex;justify-content:space-between;margin:2px 0;">
                <span style="color:#555;">C.I. / NIT:</span>
                <span>${completedSale.cliente.ciNit}</span>
              </div>`
            : ''
        }
      `
      : `
        <div style="display:flex;justify-content:space-between;margin:2px 0;">
          <span style="color:#555;">Cliente:</span>
          <span>Cliente Mostrador</span>
        </div>
      `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo - ${completedSale.comprobanteReferencia || 'Ticket'}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 4px;
            width: 72mm;
            line-height: 1.25;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .dashed { border-top: 1px dashed #000; margin: 6px 0; }
          .title { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
          .subtitle { font-size: 9px; margin-bottom: 1px; }
          table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 10px; }
          .total-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #000; }
          .footer { text-align: center; margin-top: 10px; font-size: 9px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">${configuracion?.nombreEmpresa || 'CENTRALPHONE'}</div>
          <div class="subtitle">${completedSale.caja?.sucursal?.nombre || 'Sucursal Principal'} • ${completedSale.caja?.sucursal?.ciudad || 'Santa Cruz'}</div>
          <div class="subtitle">Ticket: ${completedSale.comprobanteReferencia}</div>
          <div class="subtitle">Fecha: ${fechaHora}</div>
        </div>

        <div class="dashed"></div>

        <div style="display:flex;justify-content:space-between;margin:2px 0;">
          <span style="color:#555;">Atendido por:</span>
          <span style="font-weight:bold;">${completedSale.usuario?.nombre || 'Vendedor'}</span>
        </div>
        ${clienteInfo}
        <div style="display:flex;justify-content:space-between;margin:2px 0;">
          <span style="color:#555;">Método de Pago:</span>
          <span style="font-weight:bold;">${completedSale.metodoPago?.nombre || 'Efectivo'}</span>
        </div>

        <div class="dashed"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px dashed #000;">
              <th style="text-align: left; padding-bottom: 3px;">DESCRIPCIÓN</th>
              <th style="text-align: right; padding-bottom: 3px;">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-row">
          <span>TOTAL:</span>
          <span>Bs ${Number(completedSale.totalVentaBs).toFixed(2)}</span>
        </div>

        <div class="dashed"></div>

        <div class="footer">
          <div class="bold">*** POLIZA DE GARANTÍA CENTRALPHONE ***</div>
          <div style="margin-top: 3px;">Este ticket es su comprobante oficial para validar la garantía de 3 meses por IMEI y número de serie.</div>
          <div style="margin-top: 5px;">¡Gracias por su compra!</div>
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 250);
  };

  // Confirmar Venta
  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSaleError(null);

    // Validación obligatoria de datos del comprador para garantía
    if (!clienteNombre.trim()) {
      setSaleError('El nombre completo del cliente es obligatorio para registrar la venta y emitir la garantía.');
      return;
    }

    if (!clienteTelefono.trim()) {
      setSaleError('El teléfono de contacto del cliente es obligatorio para el registro de garantía y contacto.');
      return;
    }

    // Validación de cobro QR
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
      playSaleSuccessSound(); // Sonido armónico de venta completada exitosamente
      setCompletedSale(res);
      setCart([]);
      setClienteNombre('');
      setClienteTelefono('');
      setClienteCiNit('');
      setComprobanteRef('');
      setMontoRecibidoBs('');
      await silentRefresh(); // Revalidación silenciosa sin parpadeo de Skeletons (ID-MI-001)
    } catch (err: any) {
      setSaleError(err.message || 'Error al procesar la venta.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Filtrado de teléfonos por búsqueda
  const filteredPhones = dispositivos.filter((d) => {
    if (!searchPhone.trim()) return true;
    const q = searchPhone.toLowerCase();
    return (
      d.imei1.toLowerCase().includes(q) ||
      d.numeroSerie.toLowerCase().includes(q) ||
      d.variante?.modelo?.nombreModelo.toLowerCase().includes(q) ||
      d.variante?.color.toLowerCase().includes(q)
    );
  });

  // Filtrado de lotes de accesorios por nombre de producto o lote (ID-UX-004)
  const filteredAccessories = accesorios.flatMap((acc) => {
    const q = searchAccessory.toLowerCase().trim();
    const matchingLotes = (acc.lotes || []).filter((lote: any) => {
      if (!q) return true;
      return (
        acc.nombre.toLowerCase().includes(q) ||
        (lote.nombreDiferenciador && lote.nombreDiferenciador.toLowerCase().includes(q))
      );
    });
    return matchingLotes.map((lote: any) => ({ acc, lote }));
  });

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
              Por regla inmutable de seguridad y cuadre financiero, no puedes procesar ventas en mostrador sin antes abrir tu turno de caja.
            </p>
          </div>

          <Link href="/caja">
            <Button className="w-full mt-2">
              <Unlock className="mr-2 h-4 w-4" />
              Abrir Turno de Caja Ahora
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Encabezado POS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Punto de Venta (POS Mostrador)
            </h1>
            <Badge variant="success">Turno #{sessionData.caja.id} Activo</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Escanear IMEI o seleccionar lotes de accesorios con cobro en efectivo o QR Corporativo BCP.
          </p>
        </div>

        <Link href="/caja">
          <Button variant="outline" size="sm" className="text-xs">
            Ver Balance de Caja (Bs {sessionData.resumenFinanciero?.saldoEfectivoEnCaja?.toFixed(2)})
          </Button>
        </Link>
      </div>

      {/* Grid Principal POS: 7 columnas catálogo / 5 columnas carrito */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL IZQUIERDO: CATÁLOGO Y BUSCADOR DE PRODUCTOS (7 COLUMNAS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tabs Selector de Catálogo (ID-DS-004) */}
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
            /* LISTA DE TELÉFONOS SERIALIZADOS */
            <div className="space-y-3">
              {/* Buscador de Teléfonos con escaneo continuo por lector de barras (ID-POS-001) */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  ref={inputSearchRef}
                  autoFocus
                  aria-label="Escanear o tipear IMEI 1, Serie o Modelo"
                  className="pl-9 pr-24 text-xs font-mono"
                  placeholder="Escanear o tipear IMEI 1, Serie o Modelo..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                <span className="absolute right-2.5 top-2 hidden sm:inline-flex items-center text-[10px] font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  Enter ↵ | F2
                </span>
              </div>

              {/* Feedback de escaneo de código de barras exitoso */}
              {scanFeedback && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in duration-150">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {scanFeedback}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono">En Ticket</span>
                </div>
              )}

              {filteredPhones.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 rounded-xl bg-white">
                  No hay teléfonos disponibles para venta en esta sucursal. Registra mercadería en Recepción.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                  {filteredPhones.map((d) => {
                    const isAdded = cart.some((i) => i.dispositivoId === d.id);
                    return (
                      <div
                        key={d.id}
                        className={cn(
                          'p-3 rounded-xl border transition-all text-xs flex flex-col justify-between bg-white',
                          isAdded
                            ? 'border-slate-300 bg-slate-50/60 opacity-60'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-subtle'
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              {d.variante?.modelo?.nombreModelo}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-1.5 rounded">
                              {d.condicion}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {d.variante?.color} •{' '}
                            {d.variante?.capacidadGb >= 1024
                              ? `${d.variante?.capacidadGb / 1024}TB`
                              : `${d.variante?.capacidadGb}GB`}
                          </p>
                          <p className="font-mono text-[10px] text-slate-600 mt-1 truncate">
                            IMEI: {d.imei1}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                          <span className="font-mono font-bold text-slate-900">
                            Bs {Math.round(Number(d.costoBs) * 1.15).toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            variant={isAdded ? 'outline' : 'default'}
                            className="h-8 text-xs px-3 font-semibold"
                            disabled={isAdded}
                            onClick={() => {
                              handleAddPhoneToCart(d);
                              playScanBeep();
                            }}
                          >
                            {isAdded ? 'En Carrito' : '+ Agregar'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* LISTA DE LOTES DE ACCESORIOS (ID-UX-004) */
            <div className="space-y-3">
              {/* Buscador de Accesorios */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  aria-label="Buscar accesorio o variante"
                  className="pl-9 pr-4 text-xs"
                  placeholder="Buscar accesorio por nombre o lote (ej. Silicona, MagSafe, Carga Rápida)..."
                  value={searchAccessory}
                  onChange={(e) => setSearchAccessory(e.target.value)}
                />
              </div>

              {filteredAccessories.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 rounded-xl bg-white">
                  {searchAccessory.trim()
                    ? 'No se encontraron accesorios coincidentes con la búsqueda.'
                    : 'No hay accesorios disponibles en el inventario.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                  {filteredAccessories.map(({ acc, lote }) => (
                    <div
                      key={lote.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-subtle transition-all text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{acc.nombre}</span>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {lote.stockActual} u. en stock
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium text-[11px] mt-0.5">
                          {lote.nombreDiferenciador}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <span className="font-mono font-bold text-slate-900">
                          Bs {Number(lote.precioVentaBs).toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          className="h-8 text-xs px-3 font-semibold"
                          disabled={lote.stockActual <= 0}
                          onClick={() => {
                            handleAddAccessoryToCart(acc, lote);
                            playScanBeep();
                          }}
                        >
                          + Agregar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL DERECHO: CARRITO & CHECKOUT (5 COLUMNAS) */}
        <div className="lg:col-span-5">
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
                    onClick={handleClearCart}
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
                        {item.imei && (
                          <p className="font-mono text-[9px] text-slate-600 font-medium">
                            IMEI: {item.imei}
                          </p>
                        )}
                      </div>

                      {/* Control de Cantidad accesible para tablet y PC (ID-A11Y-001) */}
                      {item.tipo === 'ACCESORIO' ? (
                        <div className="flex items-center border border-slate-200 bg-white rounded-lg shadow-sm">
                          <button
                            type="button"
                            aria-label={`Disminuir cantidad de ${item.nombre}`}
                            onClick={() => handleUpdateQuantity(item.cartId, -1)}
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
                            onClick={() => handleUpdateQuantity(item.cartId, 1)}
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

                      {/* Precio Unitario Editable con validación onBlur (ID-UX-002) */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-[10px] text-slate-500 font-mono font-medium">Bs</span>
                          <input
                            type="number"
                            step="0.50"
                            min="0"
                            aria-label={`Precio unitario acordado para ${item.nombre}`}
                            value={item.precioUnitarioBs || ''}
                            onChange={(e) => handleUpdatePrice(item.cartId, parseFloat(e.target.value) || 0)}
                            onBlur={() => handleValidatePriceFloor(item.cartId)}
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

                      {/* Botón Eliminar con touch target adecuado y aria-label (ID-A11Y-001, ID-A11Y-003) */}
                      <button
                        type="button"
                        aria-label={`Eliminar ${item.nombre} del carrito`}
                        onClick={() => handleRemoveFromCart(item.cartId)}
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
                  <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    Obligatorio para Garantía
                  </span>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Nombre completo y apellidos *"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="text-xs bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Teléfono / WhatsApp *"
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      className="text-xs bg-white"
                    />
                    <Input
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
                      setModalQrOpen(true);
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

                {/* Calculadora de Efectivo y Vuelto Automático (ID-UX-001) */}
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
                        className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-slate-400 text-[11px] font-semibold text-slate-700 transition-colors shadow-subtle"
                      >
                        Exacto (Bs {totalBs.toFixed(2)})
                      </button>
                      {[100, 200, 500, 1000].map((billete) => {
                        return (
                          <button
                            key={billete}
                            type="button"
                            onClick={() => setMontoRecibidoBs(billete)}
                            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-slate-400 text-[11px] font-semibold text-slate-700 transition-colors shadow-subtle font-mono"
                          >
                            Bs {billete}
                          </button>
                        );
                      })}
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

                {/* Si elige QR, exigir referencia bancaria (US15) */}
                {metodoPagoCodigo === 'QR_SIMPLE' && (
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/80 space-y-3 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        Referencia Bancaria Requerida
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalQrOpen(true)}
                        className="text-slate-900 font-medium underline text-[11px] hover:text-black flex items-center gap-1"
                      >
                        <QrCode className="h-3 w-3" />
                        Ampliar QR
                      </button>
                    </div>

                    {configuracion?.qrOficialImagenUrl && (
                      <div
                        onClick={() => setModalQrOpen(true)}
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
                  onClick={handleProcessCheckout}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Finalizar Venta e Imprimir Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL DE PROYECCIÓN DE QR OFICIAL AL CLIENTE (US15) */}
      <Modal
        isOpen={modalQrOpen}
        onClose={() => setModalQrOpen(false)}
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
            onClick={() => setModalQrOpen(false)}
          >
            Listo, Continuar Cobro
          </Button>
        </div>
      </Modal>

      {/* MODAL TICKET DE VENTA COMPLETADA */}
      {completedSale && (
        <Modal
          isOpen={!!completedSale}
          onClose={() => setCompletedSale(null)}
          title="Comprobante de Venta"
          description={`Ticket #${completedSale.comprobanteReferencia}`}
        >
          <div className="space-y-4 pt-1">
            {/* Ticket Estilo Térmico Minimalista */}
            <div id="printable-ticket" className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 font-mono text-xs space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <p className="font-bold text-slate-900 text-sm">CENTRALPHONE</p>
                <p className="text-[10px] text-slate-500">
                  {completedSale.caja?.sucursal?.nombre || 'Sucursal Principal'} • {completedSale.caja?.sucursal?.ciudad || 'Santa Cruz, Bolivia'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ticket: {completedSale.comprobanteReferencia} •{' '}
                  {new Date(completedSale.fechaHora).toLocaleTimeString('es-BO')}
                </p>
              </div>

              <div className="space-y-1 text-[11px]">
                <p>
                  <span className="text-slate-500">Atendido por:</span>{' '}
                  {completedSale.usuario?.nombre}
                </p>
                <p>
                  <span className="text-slate-500">Cliente:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    {completedSale.cliente?.nombreCompleto || 'Cliente Mostrador'}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Teléfono:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    {completedSale.cliente?.telefono || 'S/N'}
                  </span>
                </p>
                {completedSale.cliente?.ciNit && (
                  <p>
                    <span className="text-slate-500">C.I. / NIT:</span>{' '}
                    <span>{completedSale.cliente.ciNit}</span>
                  </p>
                )}
                <p>
                  <span className="text-slate-500">Método de Pago:</span>{' '}
                  {completedSale.metodoPago?.nombre}
                </p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
                {completedSale.detalles?.map((det: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <p className="font-bold text-slate-900">
                        {det.tipoItem === 'DISPOSITIVO'
                          ? det.dispositivo?.variante?.modelo?.nombreModelo
                          : det.loteAccesorio?.accesorio?.nombre}
                      </p>
                      {det.dispositivo && (
                        <p className="text-[9px] text-slate-500">
                          IMEI: {det.dispositivo.imei1}
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
                  Bs {Number(completedSale.totalVentaBs).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={handlePrintReceipt}
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Imprimir Recibo
              </Button>
              <Button
                className="flex-1 text-xs"
                onClick={() => setCompletedSale(null)}
              >
                Nueva Venta
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Flotante de Deshacer Eliminación de Ítem en Mostrador (ID-POS-003) */}
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
