'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';

import { PresetFecha, ReporteRentabilidadData, TransaccionVentaReporte } from '@/features/reportes/types';
import { ReportesHeader } from '@/features/reportes/components/reportes-header';
import { ReportesKpiCards } from '@/features/reportes/components/reportes-kpi-cards';
import { ReportesVentasTable } from '@/features/reportes/components/reportes-ventas-table';
import { ModalAnularVenta } from '@/features/reportes/components/modal-anular-venta';

export default function ReportesPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Filtros
  const [presetFecha, setPresetFecha] = useState<PresetFecha>('MES');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [sucursalId, setSucursalId] = useState<string>('');
  const [sucursales, setSucursales] = useState<Array<{ id: number; nombre: string }>>([]);

  // Estados de Datos
  const [reporte, setReporte] = useState<ReporteRentabilidadData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Anulación de Venta (US19)
  const [ventaParaAnular, setVentaParaAnular] = useState<TransaccionVentaReporte | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [isAnulando, setIsAnulando] = useState(false);
  const [errorAnulacion, setErrorAnulacion] = useState<string | null>(null);

  // Formateador de fechas a YYYY-MM-DD en hora local
  const formatLocalDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dia}`;
  };

  // Inicializar fechas según preset en hora local
  const aplicarPreset = (preset: 'HOY' | 'SEMANA' | 'MES') => {
    setPresetFecha(preset);
    const ahora = new Date();
    const hoyStr = formatLocalDate(ahora);

    if (preset === 'HOY') {
      setFechaInicio(hoyStr);
      setFechaFin(hoyStr);
    } else if (preset === 'SEMANA') {
      const sieteDiasAtras = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 7);
      setFechaInicio(formatLocalDate(sieteDiasAtras));
      setFechaFin(hoyStr);
    } else if (preset === 'MES') {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      setFechaInicio(formatLocalDate(inicioMes));
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
      <ReportesHeader
        isLoading={isLoading}
        onRefresh={fetchReporte}
        presetFecha={presetFecha}
        onAplicarPreset={aplicarPreset}
        setPresetFecha={setPresetFecha}
        fechaInicio={fechaInicio}
        setFechaInicio={setFechaInicio}
        fechaFin={fechaFin}
        setFechaFin={setFechaFin}
        sucursalId={sucursalId}
        setSucursalId={setSucursalId}
        sucursales={sucursales}
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          {error}
        </div>
      )}

      <ReportesKpiCards
        reporte={reporte}
        isLoading={isLoading}
      />

      {reporte && (
        <ReportesVentasTable
          transacciones={reporte.transacciones}
          onOpenAnulacion={(t) => {
            setVentaParaAnular(t);
            setMotivoAnulacion('');
            setErrorAnulacion(null);
          }}
        />
      )}

      <ModalAnularVenta
        isOpen={Boolean(ventaParaAnular)}
        onClose={() => setVentaParaAnular(null)}
        ventaParaAnular={ventaParaAnular}
        motivoAnulacion={motivoAnulacion}
        setMotivoAnulacion={setMotivoAnulacion}
        isAnulando={isAnulando}
        errorAnulacion={errorAnulacion}
        onSubmit={handleConfirmarAnulacion}
      />
    </div>
  );
}
