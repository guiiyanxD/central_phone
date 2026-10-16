'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Receipt,
  Building2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Ban,
  CheckCircle2,
  Filter,
  CreditCard,
  PieChart,
  ArrowDownRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';

export default function ReportesPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Filtros
  const [presetFecha, setPresetFecha] = useState<'HOY' | 'SEMANA' | 'MES' | 'CUSTOM'>('MES');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [sucursalId, setSucursalId] = useState<string>('');
  const [sucursales, setSucursales] = useState<Array<{ id: number; nombre: string }>>([]);

  // Estados de Datos
  const [reporte, setReporte] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Anulación de Venta (US19)
  const [ventaParaAnular, setVentaParaAnular] = useState<any | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [isAnulando, setIsAnulando] = useState(false);
  const [errorAnulacion, setErrorAnulacion] = useState<string | null>(null);

  // Inicializar fechas según preset
  const aplicarPreset = (preset: 'HOY' | 'SEMANA' | 'MES') => {
    setPresetFecha(preset);
    const ahora = new Date();
    const hoyStr = ahora.toISOString().slice(0, 10);

    if (preset === 'HOY') {
      setFechaInicio(hoyStr);
      setFechaFin(hoyStr);
    } else if (preset === 'SEMANA') {
      const sieteDiasAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      setFechaInicio(sieteDiasAtras.toISOString().slice(0, 10));
      setFechaFin(hoyStr);
    } else if (preset === 'MES') {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      // Ajuste local de fecha YYYY-MM-DD
      const anio = inicioMes.getFullYear();
      const mes = String(inicioMes.getMonth() + 1).padStart(2, '0');
      const dia = String(inicioMes.getDate()).padStart(2, '0');
      setFechaInicio(`${anio}-${mes}-${dia}`);
      setFechaFin(hoyStr);
    }
  };

  useEffect(() => {
    aplicarPreset('MES');
    api.sucursales.getAll().then((data) => {
      setSucursales(data.map((s) => ({ id: s.id, nombre: s.nombre })));
    }).catch(() => {});
  }, []);

  const fetchReporte = async () => {
    if (!fechaInicio) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.ventas.getReporteRentabilidad({
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        sucursalId: sucursalId ? parseInt(sucursalId, 10) : undefined,
      });
      setReporte(data);
    } catch (err: any) {
      setError(
        err instanceof ApiError ? err.message : 'Error al cargar el reporte financiero.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.rol === 'ADMIN' && fechaInicio) {
      fetchReporte();
    }
  }, [user, fechaInicio, fechaFin, sucursalId]);

  // Ejecutar Anulación Atómica (US19)
  const handleConfirmarAnulacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ventaParaAnular || motivoAnulacion.trim().length < 10) {
      setErrorAnulacion('El motivo debe contener al menos 10 caracteres explicativos.');
      return;
    }

    setIsAnulando(true);
    setErrorAnulacion(null);
    try {
      await api.ventas.anular(ventaParaAnular.id, motivoAnulacion.trim());
      setVentaParaAnular(null);
      setMotivoAnulacion('');
      // Refrescar reporte completo
      await fetchReporte();
    } catch (err: any) {
      setErrorAnulacion(
        err instanceof ApiError ? err.message : 'Error al procesar la anulación de la venta.'
      );
    } finally {
      setIsAnulando(false);
    }
  };

  // Bloqueo estricto de RBAC para rol VENDEDOR
  if (!authLoading && user && user.rol !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="h-16 w-16 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Acceso Restringido a Finanzas
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          El reporte financiero y análisis de rentabilidad neta contiene información confidencial de costos de importación y balances de utilidades, reservado exclusivamente para Administradores.
        </p>
        <div className="pt-4">
          <Link href="/pos">
            <Button variant="default">Volver al Punto de Venta (POS)</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-slate-900" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Reporte Financiero y Rentabilidad Neta
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas analíticas consolidadas en 3FN: Ventas - Costo Mercadería (CMV) - Gastos de Caja = Utilidad Neta Real
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReporte}
          isLoading={isLoading}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Barra de Filtros y Rango de Fechas */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 mr-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Período:
            </span>
            <Button
              type="button"
              variant={presetFecha === 'HOY' ? 'default' : 'outline'}
              size="sm"
              onClick={() => aplicarPreset('HOY')}
              className="text-xs h-7"
            >
              Hoy
            </Button>
            <Button
              type="button"
              variant={presetFecha === 'SEMANA' ? 'default' : 'outline'}
              size="sm"
              onClick={() => aplicarPreset('SEMANA')}
              className="text-xs h-7"
            >
              Últimos 7 días
            </Button>
            <Button
              type="button"
              variant={presetFecha === 'MES' ? 'default' : 'outline'}
              size="sm"
              onClick={() => aplicarPreset('MES')}
              className="text-xs h-7"
            >
              Este Mes
            </Button>
            <Button
              type="button"
              variant={presetFecha === 'CUSTOM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPresetFecha('CUSTOM')}
              className="text-xs h-7"
            >
              Personalizado
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Desde:
              </label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPresetFecha('CUSTOM');
                }}
                className="text-xs h-8"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Hasta:
              </label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPresetFecha('CUSTOM');
                }}
                className="text-xs h-8"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Sucursal:
              </label>
              <Select
                value={sucursalId}
                onChange={(e) => setSucursalId(e.target.value)}
                className="text-xs h-8"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas Principales de Rentabilidad */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : reporte ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Ingresos Totales */}
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Total Ventas
                  </span>
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 font-mono">
                  Bs {reporte.resumen.totalIngresosBs.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {reporte.resumen.cantidadVentasCompletadas} ventas completadas
                  {reporte.resumen.cantidadVentasAnuladas > 0 && (
                    <span className="text-rose-600 font-semibold ml-1">
                      ({reporte.resumen.cantidadVentasAnuladas} anuladas)
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* 2. Costo Mercadería (CMV) */}
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Costo CMV
                  </span>
                  <Receipt className="h-4 w-4 text-slate-600" />
                </div>
                <div className="text-lg font-bold text-slate-700 font-mono">
                  Bs {reporte.resumen.totalCostoMercaderiaBs.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {reporte.resumen.totalDispositivosVendidos} teléfonos •{' '}
                  {reporte.resumen.totalAccesoriosVendidos} accesorios
                </p>
              </CardContent>
            </Card>

            {/* 3. Margen Bruto */}
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Ganancia Bruta
                  </span>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-lg font-bold text-emerald-700 font-mono">
                  Bs {reporte.resumen.gananciaBrutaBs.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ingresos menos costo directo
                </p>
              </CardContent>
            </Card>

            {/* 4. Gastos Operativos de Caja */}
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Gastos de Caja
                  </span>
                  <ArrowDownRight className="h-4 w-4 text-rose-600" />
                </div>
                <div className="text-lg font-bold text-rose-700 font-mono">
                  Bs {reporte.resumen.totalGastosOperativosBs.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {reporte.resumen.totalGastosCount} egresos registrados
                </p>
              </CardContent>
            </Card>

            {/* 5. Ganancia Neta Real */}
            <Card className="border-slate-900 bg-slate-900 text-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Utilidad Neta Real
                  </span>
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40 font-mono">
                    {reporte.resumen.margenNetoPorcentaje}%
                  </Badge>
                </div>
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  Bs {reporte.resumen.gananciaNetaRealBs.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ganancia líquida final
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Desglose Secundario: Métodos de Pago y Gastos por Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200">
              <CardHeader className="py-3 px-4 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-slate-600" />
                  Ingresos por Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                {Object.entries(reporte.desgloseMetodosPago || {}).length === 0 ? (
                  <p className="text-slate-400 italic">No hay ingresos registrados en el período.</p>
                ) : (
                  Object.entries(reporte.desgloseMetodosPago).map(([metodo, monto]: [string, any]) => (
                    <div key={metodo} className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-600">{metodo}</span>
                      <strong className="font-mono text-slate-900">Bs {Number(monto).toFixed(2)}</strong>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="py-3 px-4 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <PieChart className="h-4 w-4 text-slate-600" />
                  Gastos Operativos por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                {Object.entries(reporte.desgloseGastosPorCategoria || {}).length === 0 ? (
                  <p className="text-slate-400 italic">No hay gastos operativos registrados en el período.</p>
                ) : (
                  Object.entries(reporte.desgloseGastosPorCategoria).map(([cat, monto]: [string, any]) => (
                    <div key={cat} className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-600">{cat}</span>
                      <strong className="font-mono text-rose-700">Bs {Number(monto).toFixed(2)}</strong>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Auditoría de Transacciones con Acción de Anulación */}
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold text-slate-900">
                  Auditoría Detallada de Ventas y Tickets ({reporte.transacciones.length})
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500">
                  Permite auditar el desglose de cada ticket y anular transacciones con reposición atómica de inventario.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Ticket / Fecha</th>
                    <th className="py-3 px-3">Vendedor & Sucursal</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Pago</th>
                    <th className="py-3 px-3 text-right">Total Venta</th>
                    <th className="py-3 px-3 text-right">Costo (CMV)</th>
                    <th className="py-3 px-3 text-right">Ganancia</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reporte.transacciones.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        No se encontraron transacciones en el rango de fechas seleccionado.
                      </td>
                    </tr>
                  ) : (
                    reporte.transacciones.map((t: any) => (
                      <tr
                        key={t.id}
                        className={cn(
                          'hover:bg-slate-50/80 transition-colors',
                          t.estado === 'ANULADA' && 'bg-rose-50/20 text-slate-400'
                        )}
                      >
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-900 font-mono">
                            {t.comprobanteReferencia}
                          </p>
                          <p className="text-slate-400 text-[10px]">
                            {new Date(t.fechaHora).toLocaleString('es-BO', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-slate-800 font-medium">{t.vendedor}</p>
                          <p className="text-slate-400 text-[10px]">{t.sucursal}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-slate-800">{t.cliente}</p>
                          {t.clienteTelefono && (
                            <p className="text-slate-400 text-[10px]">{t.clienteTelefono}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {t.metodoPago}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          Bs {t.totalVentaBs.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          Bs {t.costoTotalBs.toFixed(2)}
                        </td>
                        <td
                          className={cn(
                            'py-2.5 px-3 text-right font-mono font-semibold',
                            t.estado === 'ANULADA' ? 'text-slate-400 line-through' : 'text-emerald-700'
                          )}
                        >
                          Bs {t.gananciaBs.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded border',
                              t.estado === 'ANULADA'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            )}
                          >
                            {t.estado}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {t.estado === 'COMPLETADA' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-[11px] h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                              onClick={() => {
                                setVentaParaAnular(t);
                                setMotivoAnulacion('');
                                setErrorAnulacion(null);
                              }}
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Anular
                            </Button>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic text-right" title={t.motivoAnulacion || ''}>
                              {t.motivoAnulacion ? (
                                <span className="cursor-help" title={`Motivo: ${t.motivoAnulacion} | Por: ${t.anuladoPor}`}>
                                  Anulada
                                </span>
                              ) : (
                                'Anulada'
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}

      {/* Modal de Anulación de Venta con Rollback Atómico (US19) */}
      <Modal
        isOpen={Boolean(ventaParaAnular)}
        onClose={() => setVentaParaAnular(null)}
        title={
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Anular Venta #{ventaParaAnular?.comprobanteReferencia}</span>
          </div>
        }
        className="max-w-lg"
      >
        <form onSubmit={handleConfirmarAnulacion} className="space-y-4 text-xs text-slate-700">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Info className="h-4 w-4 text-rose-600" />
              Rollback Atómico de Inventario y Caja
            </p>
            <p className="text-[11px] text-rose-800">
              Esta acción revertirá automáticamente el estado de todos los teléfonos a <strong>DISPONIBLE</strong>, repondrá las cantidades vendidas al stock de lotes de accesorios y excluirá este monto del arqueo teórico de caja.
            </p>
          </div>

          {ventaParaAnular && (
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1 font-mono text-[11px]">
              <div><strong>Ticket:</strong> {ventaParaAnular.comprobanteReferencia}</div>
              <div><strong>Vendedor:</strong> {ventaParaAnular.vendedor}</div>
              <div><strong>Total Venta:</strong> Bs {ventaParaAnular.totalVentaBs.toFixed(2)}</div>
              <div><strong>Ítems:</strong> {ventaParaAnular.itemsCount} productos</div>
            </div>
          )}

          {errorAnulacion && (
            <div className="p-2.5 bg-rose-100 border border-rose-300 rounded text-rose-800 text-[11px] font-medium">
              {errorAnulacion}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Motivo Obligatorio de Anulación (Mínimo 10 caracteres): *
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 h-24"
              placeholder="Ej: Cobro duplicado por error en terminal QR, cliente solicitó cancelación inmediata..."
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {motivoAnulacion.length}/10 caracteres mínimos requeridos para auditoría.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setVentaParaAnular(null)}
              disabled={isAnulando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
              isLoading={isAnulando}
              disabled={motivoAnulacion.trim().length < 10}
            >
              Confirmar Anulación
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
