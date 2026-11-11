'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  RefreshCw,
  Package,
  Repeat,
  Save,
  CheckCircle2,
  AlertCircle,
  Percent,
  Coins,
  Calculator,
  Info,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import {
  ReglaMargenPrecio,
  CategoriaMargen,
  TipoAumentoMargen,
} from '@/lib/api/configuracion.api';
import { calcularPrecioSugeridoBs } from '@/lib/utils/pricing.util';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CategoryConfigMeta {
  categoria: CategoriaMargen;
  titulo: string;
  subtitulo: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClase: string;
  costoSimulacionDefault: number;
  placeholderBs: string;
  placeholderUsd: string;
}

const CATEGORIAS_CONFIG: CategoryConfigMeta[] = [
  {
    categoria: 'DISPOSITIVO_NUEVO',
    titulo: 'Dispositivos Nuevos',
    subtitulo: 'iPhones y celulares en caja sellada sin uso previo',
    icon: Smartphone,
    colorClase: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    costoSimulacionDefault: 5000,
    placeholderBs: '15',
    placeholderUsd: '15',
  },
  {
    categoria: 'DISPOSITIVO_USADO',
    titulo: 'Dispositivos Seminuevos / Open Box',
    subtitulo: 'Equipos seminuevos, exhibición o de segunda mano mayorista',
    icon: RefreshCw,
    colorClase: 'text-blue-700 bg-blue-50 border-blue-200',
    costoSimulacionDefault: 3200,
    placeholderBs: '15',
    placeholderUsd: '15',
  },
  {
    categoria: 'ACCESORIO',
    titulo: 'Accesorios y Repuestos',
    subtitulo: 'Fundas, cargadores, vidrios templados y componentes',
    icon: Package,
    colorClase: 'text-amber-700 bg-amber-50 border-amber-200',
    costoSimulacionDefault: 40,
    placeholderBs: '20',
    placeholderUsd: '20',
  },
  {
    categoria: 'PERMUTA',
    titulo: 'Permutas (Trade-In)',
    subtitulo: 'Equipos entregados por clientes como parte de pago',
    icon: Repeat,
    colorClase: 'text-violet-700 bg-violet-50 border-violet-200',
    costoSimulacionDefault: 2000,
    placeholderBs: '15',
    placeholderUsd: '15',
  },
];

export function MargenesConfigForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Form state indexed by category
  const [reglasState, setReglasState] = useState<Record<CategoriaMargen, ReglaMargenPrecio>>({
    DISPOSITIVO_NUEVO: {
      id: 1,
      categoria: 'DISPOSITIVO_NUEVO',
      tipoAumento: 'PORCENTAJE',
      valorBs: 15,
      tipoAumentoUsd: 'PORCENTAJE',
      valorUsd: 15,
    },
    DISPOSITIVO_USADO: {
      id: 2,
      categoria: 'DISPOSITIVO_USADO',
      tipoAumento: 'PORCENTAJE',
      valorBs: 15,
      tipoAumentoUsd: 'PORCENTAJE',
      valorUsd: 15,
    },
    ACCESORIO: {
      id: 3,
      categoria: 'ACCESORIO',
      tipoAumento: 'PORCENTAJE',
      valorBs: 15,
      tipoAumentoUsd: 'PORCENTAJE',
      valorUsd: 15,
    },
    PERMUTA: {
      id: 4,
      categoria: 'PERMUTA',
      tipoAumento: 'PORCENTAJE',
      valorBs: 15,
      tipoAumentoUsd: 'PORCENTAJE',
      valorUsd: 15,
    },
  });

  // Simulation inputs
  const [simulaciones, setSimulaciones] = useState<Record<CategoriaMargen, { costo: number; gastos: number }>>({
    DISPOSITIVO_NUEVO: { costo: 5000, gastos: 0 },
    DISPOSITIVO_USADO: { costo: 3200, gastos: 100 },
    ACCESORIO: { costo: 40, gastos: 0 },
    PERMUTA: { costo: 2000, gastos: 150 },
  });

  useEffect(() => {
    async function cargarMargenes() {
      try {
        setLoading(true);
        const data = await api.configuracion.getMargenes();
        if (Array.isArray(data) && data.length > 0) {
          setReglasState((prev) => {
            const mapped: any = { ...prev };
            data.forEach((r) => {
              mapped[r.categoria] = {
                id: r.id,
                categoria: r.categoria,
                tipoAumento: r.tipoAumento,
                valorBs: Number(r.valorBs),
                tipoAumentoUsd: r.tipoAumentoUsd || 'PORCENTAJE',
                valorUsd: Number(r.valorUsd ?? r.valorBs),
              };
            });
            return mapped;
          });
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err instanceof ApiError ? err.message : 'Error al cargar reglas de márgenes.',
        });
      } finally {
        setLoading(false);
      }
    }

    cargarMargenes();
  }, []);

  const handleFieldChange = (
    categoria: CategoriaMargen,
    field: keyof ReglaMargenPrecio,
    value: any,
  ) => {
    setReglasState((prev) => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [field]: value,
      },
    }));
  };

  const handleSimulacionChange = (
    categoria: CategoriaMargen,
    field: 'costo' | 'gastos',
    value: number,
  ) => {
    setSimulaciones((prev) => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [field]: value,
      },
    }));
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const payload = {
        reglas: Object.values(reglasState).map((r) => ({
          categoria: r.categoria,
          tipoAumento: r.tipoAumento,
          valorBs: Number(r.valorBs) || 0,
          tipoAumentoUsd: r.tipoAumentoUsd || 'PORCENTAJE',
          valorUsd: Number(r.valorUsd) || 0,
        })),
      };

      const updated = await api.configuracion.updateMargenes(payload);

      if (Array.isArray(updated) && updated.length > 0) {
        const mapped: any = { ...reglasState };
        updated.forEach((r) => {
          mapped[r.categoria] = {
            id: r.id,
            categoria: r.categoria,
            tipoAumento: r.tipoAumento,
            valorBs: Number(r.valorBs),
            tipoAumentoUsd: r.tipoAumentoUsd || 'PORCENTAJE',
            valorUsd: Number(r.valorUsd ?? r.valorBs),
          };
        });
        setReglasState(mapped);
      }

      setFeedback({
        type: 'success',
        message: '¡Reglas de márgenes y precios sugeridos actualizadas con éxito!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Error al guardar la configuración.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-96 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Informativo de Reglas Financieras */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900 shadow-sm flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-950">
            Mecanismo Centralizado de Precios Sugeridos
          </p>
          <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
            Las reglas configuradas a continuación determinan el cálculo automático del{' '}
            <strong>precio sugerido de venta</strong> en recepciones mayoristas, permutas y lotes de accesorios.
            El vendedor siempre puede ajustar manualmente el precio final antes de confirmar.
          </p>
          <div className="pt-1.5 flex flex-wrap gap-4 text-xs text-blue-900 font-mono">
            <span>• <strong>Porcentaje:</strong> Math.ceil(CostoBase × (1 + Margen%)) + Gastos</span>
            <span>• <strong>Absoluto:</strong> CostoBase + MargenBs + Gastos</span>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={cn(
            'p-4 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in duration-200',
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900',
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Grid de 4 Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CATEGORIAS_CONFIG.map((catMeta) => {
          const regla = reglasState[catMeta.categoria];
          const sim = simulaciones[catMeta.categoria];
          const Icon = catMeta.icon;

          // Cálculo en vivo para la simulación
          const precioSugeridoSimulado = calcularPrecioSugeridoBs(sim.costo, regla, sim.gastos);
          const gananciaSimulada = precioSugeridoSimulado - (sim.costo + sim.gastos);

          return (
            <Card
              key={catMeta.categoria}
              className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-11 w-11 rounded-xl border flex items-center justify-center shrink-0',
                        catMeta.colorClase,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        {catMeta.titulo}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        {catMeta.subtitulo}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* 1. SECCIÓN BOLIVIANOS (ACTIVA) */}
                <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-emerald-600" />
                      Margen en Bolivianos (BOB)
                    </span>
                    <Badge variant="default" className="text-[10px] bg-emerald-600">
                      Operativo
                    </Badge>
                  </div>

                  {/* Selector de Tipo de Aumento */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange(catMeta.categoria, 'tipoAumento', 'PORCENTAJE')}
                      className={cn(
                        'py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all',
                        regla.tipoAumento === 'PORCENTAJE'
                          ? 'bg-white border-primary text-primary shadow-sm ring-1 ring-primary/20'
                          : 'bg-transparent border-slate-200 text-slate-600 hover:bg-white',
                      )}
                    >
                      <Percent className="h-3.5 w-3.5" />
                      <span>Porcentaje (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange(catMeta.categoria, 'tipoAumento', 'ABSOLUTO')}
                      className={cn(
                        'py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all',
                        regla.tipoAumento === 'ABSOLUTO'
                          ? 'bg-white border-primary text-primary shadow-sm ring-1 ring-primary/20'
                          : 'bg-transparent border-slate-200 text-slate-600 hover:bg-white',
                      )}
                    >
                      <Coins className="h-3.5 w-3.5" />
                      <span>Fijo en Bs</span>
                    </button>
                  </div>

                  {/* Input de Valor */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      {regla.tipoAumento === 'PORCENTAJE'
                        ? 'Porcentaje a sumar sobre costo base (%)'
                        : 'Monto fijo a sumar sobre costo base (Bs)'}
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step={regla.tipoAumento === 'PORCENTAJE' ? '0.5' : '1'}
                        value={regla.valorBs}
                        onChange={(e) =>
                          handleFieldChange(
                            catMeta.categoria,
                            'valorBs',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="pr-12 text-sm font-semibold"
                        placeholder={catMeta.placeholderBs}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                        {regla.tipoAumento === 'PORCENTAJE' ? '%' : 'Bs'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SECCIÓN DÓLARES (INFORMATIVA / PREPARACIÓN) */}
                <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-xl border border-dashed border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-slate-400" />
                      Margen en Dólares (USD)
                    </span>
                    <Badge variant="outline" className="text-[10px] text-slate-500 bg-white">
                      Próximamente / Informativo
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange(catMeta.categoria, 'tipoAumentoUsd', 'PORCENTAJE')}
                      className={cn(
                        'py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all',
                        regla.tipoAumentoUsd === 'PORCENTAJE'
                          ? 'bg-white border-slate-400 text-slate-800 shadow-xs'
                          : 'bg-transparent border-slate-200 text-slate-500 hover:bg-white',
                      )}
                    >
                      <Percent className="h-3 w-3" />
                      <span>Porcentaje (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange(catMeta.categoria, 'tipoAumentoUsd', 'ABSOLUTO')}
                      className={cn(
                        'py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all',
                        regla.tipoAumentoUsd === 'ABSOLUTO'
                          ? 'bg-white border-slate-400 text-slate-800 shadow-xs'
                          : 'bg-transparent border-slate-200 text-slate-500 hover:bg-white',
                      )}
                    >
                      <Coins className="h-3 w-3" />
                      <span>Fijo en USD</span>
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step={regla.tipoAumentoUsd === 'PORCENTAJE' ? '0.5' : '1'}
                      value={regla.valorUsd}
                      onChange={(e) =>
                        handleFieldChange(
                          catMeta.categoria,
                          'valorUsd',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="pr-12 text-xs"
                      placeholder={catMeta.placeholderUsd}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-medium text-slate-400">
                      {regla.tipoAumentoUsd === 'PORCENTAJE' ? '%' : '$'}
                    </div>
                  </div>
                </div>

                {/* 3. SIMULADOR EN TIEMPO REAL */}
                <div className="bg-slate-100/90 rounded-xl p-3.5 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Calculator className="h-3.5 w-3.5 text-primary" />
                    <span>Simulación en Vivo</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">
                        Costo Base (Bs)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={sim.costo}
                        onChange={(e) =>
                          handleSimulacionChange(
                            catMeta.categoria,
                            'costo',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">
                        Gastos / Rep. (Bs)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={sim.gastos}
                        onChange={(e) =>
                          handleSimulacionChange(
                            catMeta.categoria,
                            'gastos',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                        Precio Sugerido
                      </span>
                      <span className="text-base font-black text-slate-900">
                        Bs {precioSugeridoSimulado.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                        Margen Bruto
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        +Bs {gananciaSimulada.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Botón de Guardar en la parte inferior */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <Button
          onClick={handleGuardar}
          disabled={saving}
          className="gap-2 px-6 h-11 text-sm font-semibold shadow-md"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Guardando cambios...' : 'Guardar Configuración de Márgenes'}</span>
        </Button>
      </div>
    </div>
  );
}
