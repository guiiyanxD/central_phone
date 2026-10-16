'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Headphones,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Building2,
  History,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { ModalLineaVida } from './modal-linea-vida';
import { cn } from '@/lib/utils';

export default function InventarioPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'telefonos' | 'accesorios' | 'catalogo'>('telefonos');

  // Estados de Dispositivos (Smartphones)
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');
  const [isLoadingDispositivos, setIsLoadingDispositivos] = useState(true);
  const [selectedImeiForLifeline, setSelectedImeiForLifeline] = useState<string | null>(null);

  // Estados de Accesorios y Lotes
  const [accesorios, setAccesorios] = useState<any[]>([]);
  const [isLoadingAccesorios, setIsLoadingAccesorios] = useState(true);

  // Estados de Catálogo de Modelos
  const [modelos, setModelos] = useState<any[]>([]);
  const [isLoadingModelos, setIsLoadingModelos] = useState(true);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Modal para Alta de Nuevo Modelo (Invariante: >= 1 variante)
  const [modalNuevoModeloOpen, setModalNuevoModeloOpen] = useState(false);
  const [nuevoNombreModelo, setNuevoNombreModelo] = useState('');
  const [nuevoMarca, setNuevoMarca] = useState('Apple');
  const [primeraVarColor, setPrimeraVarColor] = useState('');
  const [primeraVarCapacidad, setPrimeraVarCapacidad] = useState(256);
  const [primeraVarSim, setPrimeraVarSim] = useState('SIM Físico');
  const [isCreatingModelo, setIsCreatingModelo] = useState(false);
  const [creacionError, setCreacionError] = useState<string | null>(null);

  // Carga de datos
  const fetchDispositivos = async () => {
    setIsLoadingDispositivos(true);
    try {
      const data = await api.modelos.getDispositivos({
        estado: estadoFilter,
        busqueda: searchQuery,
      });
      setDispositivos(data);
    } catch {
      // Manejar error silenciosamente
    } finally {
      setIsLoadingDispositivos(false);
    }
  };

  const fetchAccesorios = async () => {
    setIsLoadingAccesorios(true);
    try {
      const data = await api.accesorios.getAll();
      setAccesorios(data);
    } finally {
      setIsLoadingAccesorios(false);
    }
  };

  const fetchModelos = async () => {
    setIsLoadingModelos(true);
    try {
      const data = await api.modelos.getAll();
      setModelos(data);
    } finally {
      setIsLoadingModelos(false);
    }
  };

  useEffect(() => {
    fetchDispositivos();
  }, [estadoFilter]);

  useEffect(() => {
    fetchAccesorios();
    fetchModelos();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDispositivos();
  };

  // Re-importar CSV oficial iPhone 18 (US06)
  const handleImportarCsv = async () => {
    setIsImportingCsv(true);
    setImportResult(null);
    try {
      const res = await api.modelos.importarCsv();
      setImportResult(
        `Importación completada: ${res.modelosCreados || 0} modelos creados, ${res.variantesCreadas || 0} variantes añadidas.`
      );
      await fetchModelos();
    } catch (err: any) {
      setImportResult(`Error en importación: ${err.message}`);
    } finally {
      setIsImportingCsv(false);
    }
  };

  // Crear Modelo con Invariante Atómica (US05)
  const handleCreateModelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreModelo.trim() || !primeraVarColor.trim()) return;

    setIsCreatingModelo(true);
    setCreacionError(null);

    try {
      await api.modelos.create({
        nombreModelo: nuevoNombreModelo.trim(),
        marca: nuevoMarca.trim() || 'Apple',
        variantes: [
          {
            color: primeraVarColor.trim(),
            capacidadGb: Number(primeraVarCapacidad),
            tipoSim: primeraVarSim,
          },
        ],
      });
      setModalNuevoModeloOpen(false);
      setNuevoNombreModelo('');
      setPrimeraVarColor('');
      await fetchModelos();
    } catch (err: any) {
      setCreacionError(err.message || 'Error al crear el modelo.');
    } finally {
      setIsCreatingModelo(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Encabezado y Selector de Pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Control de Inventario & Catálogo
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión de stock físico serializado por IMEI, lotes de accesorios y catálogo de variantes.
          </p>
        </div>

        <Link href="/recepcion">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Recibir Mercadería
          </Button>
        </Link>
      </div>

      {/* Tabs Minimalistas */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('telefonos')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-colors',
            activeTab === 'telefonos'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Smartphone className="h-4 w-4" />
          <span>Teléfonos Serializados</span>
          <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600">
            {dispositivos.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('accesorios')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-colors',
            activeTab === 'accesorios'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Headphones className="h-4 w-4" />
          <span>Lotes de Accesorios</span>
        </button>

        <button
          onClick={() => setActiveTab('catalogo')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-colors',
            activeTab === 'catalogo'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Catálogo de Modelos ({modelos.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: TELÉFONOS SERIALIZADOS (US09) */}
      {activeTab === 'telefonos' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por IMEI, Serie o Modelo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline" size="sm">
                Buscar
              </Button>
            </form>

            <div className="flex gap-2">
              <Select
                className="w-40"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="DISPONIBLE">Disponibles</option>
                <option value="VENDIDO">Vendidos</option>
                <option value="RESERVADO">Reservados</option>
                <option value="EN_GARANTIA">En Garantía</option>
                <option value="DEFECTUOSO">Defectuoso</option>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setEstadoFilter('TODOS');
                  fetchDispositivos();
                }}
                title="Refrescar lista"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabla de Teléfonos */}
          <Card className="border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Modelo & Variante</th>
                    <th className="py-3 px-4">IMEI 1 / Serie</th>
                    <th className="py-3 px-4">Condición</th>
                    <th className="py-3 px-4">
                      {user?.rol === 'ADMIN' ? 'Costo / P. Sugerido' : 'Precio Sugerido'}
                    </th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingDispositivos ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <div className="space-y-2 max-w-sm mx-auto">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4 mx-auto" />
                        </div>
                      </td>
                    </tr>
                  ) : dispositivos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No se encontraron teléfonos con los criterios seleccionados.
                      </td>
                    </tr>
                  ) : (
                    dispositivos.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">
                            {d.variante?.modelo?.nombreModelo}
                          </p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {d.variante?.color} •{' '}
                            {d.variante?.capacidadGb >= 1024
                              ? `${d.variante?.capacidadGb / 1024}TB`
                              : `${d.variante?.capacidadGb}GB`}{' '}
                            • {d.variante?.tipoSim}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <button
                            type="button"
                            onClick={() => setSelectedImeiForLifeline(d.imei1)}
                            className="group text-left inline-flex items-center gap-1.5 text-slate-900 font-semibold hover:text-indigo-600 transition-colors"
                            title="Consultar Línea de Vida Completa"
                          >
                            <span>{d.imei1}</span>
                            <History className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          </button>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            Serie: {d.numeroSerie}
                            {d.imei2 && (
                              <button
                                type="button"
                                onClick={() => setSelectedImeiForLifeline(d.imei2)}
                                className="ml-1 text-slate-500 hover:text-indigo-600 hover:underline"
                                title="Consultar Línea de Vida para IMEI 2"
                              >
                                | IMEI 2: {d.imei2}
                              </button>
                            )}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded border',
                              d.condicion === 'NUEVO'
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            )}
                          >
                            {d.condicion}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-800">
                          {user?.rol === 'ADMIN' ? (
                            <>
                              <p className="font-semibold">Bs {Number(d.costoBs).toFixed(2)}</p>
                              <p className="text-[10px] text-emerald-700 font-medium">
                                Sug: Bs {Number(d.precioVentaSugeridoBs || 0).toFixed(2)}
                              </p>
                            </>
                          ) : (
                            <p className="font-semibold text-slate-900">
                              Bs {Number(d.precioVentaSugeridoBs || 0).toFixed(2)}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            <span>{d.sucursal?.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge
                            variant={
                              d.estadoInventario === 'DISPONIBLE'
                                ? 'success'
                                : d.estadoInventario === 'VENDIDO'
                                ? 'secondary'
                                : 'warning'
                            }
                          >
                            {d.estadoInventario}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* PESTAÑA 2: LOTES DE ACCESORIOS (US10) */}
      {activeTab === 'accesorios' && (
        <div className="space-y-4">
          <Card className="border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Accesorio Base</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Lote Diferenciador</th>
                    <th className="py-3 px-4">Costo Adquisición</th>
                    <th className="py-3 px-4">Precio Sugerido</th>
                    <th className="py-3 px-4 text-center">Stock Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingAccesorios ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <Skeleton className="h-4 w-3/4 mx-auto" />
                      </td>
                    </tr>
                  ) : accesorios.flatMap((a) => a.lotes || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No hay lotes de accesorios registrados aún. Utiliza el formulario de Recepción para dar de alta existencias.
                      </td>
                    </tr>
                  ) : (
                    accesorios.flatMap((acc) =>
                      (acc.lotes || []).map((lote: any) => (
                        <tr key={lote.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {acc.nombre}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {acc.categoria?.nombre}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {lote.nombreDiferenciador}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            Bs {Number(lote.costoUnitarioBs).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                            Bs {Number(lote.precioVentaBs).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full font-bold text-xs',
                                lote.stockActual > 5
                                  ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                  : 'bg-slate-900 text-white border border-slate-900'
                              )}
                            >
                              {lote.stockActual} u.
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* PESTAÑA 3: CATÁLOGO DE MODELOS Y VARIANTES (US05 & US06) */}
      {activeTab === 'catalogo' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Catálogo Oficial Apple & Invariante de Variantes
              </h3>
              <p className="text-xs text-slate-500">
                Todo modelo existe obligatoriamente con al menos una variante (Color, Capacidad, SIM).
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportarCsv}
                isLoading={isImportingCsv}
                loadingText="Importando CSV..."
                className="text-xs"
              >
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-slate-700" />
                Sincronizar CSV iPhone 18
              </Button>

              <Button
                size="sm"
                onClick={() => setModalNuevoModeloOpen(true)}
                className="text-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo Modelo
              </Button>
            </div>
          </div>

          {importResult && (
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-800" />
              <span>{importResult}</span>
            </div>
          )}

          {/* Grid de Modelos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingModelos ? (
              <Skeleton className="h-44 w-full rounded-2xl" />
            ) : (
              modelos.map((m) => (
                <Card key={m.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                  <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        {m.nombreModelo}
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">
                        Marca: {m.marca}
                      </CardDescription>
                    </div>
                    <Badge variant="mono">{m.variantes?.length || 0} variantes</Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-3">
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Variantes registradas:
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                      {m.variantes?.map((v: any) => (
                        <span
                          key={v.id}
                          className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700"
                        >
                          {v.color} •{' '}
                          {v.capacidadGb >= 1024
                            ? `${v.capacidadGb / 1024}TB`
                            : `${v.capacidadGb}GB`}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR MODELO (INVARIANTE ATÓMICA US05) */}
      <Modal
        isOpen={modalNuevoModeloOpen}
        onClose={() => setModalNuevoModeloOpen(false)}
        title="Crear Nuevo Modelo con Variante Obligatoria"
        description="Por regla inmutable de negocio, ningún modelo puede nacer sin al menos una variante."
      >
        <form onSubmit={handleCreateModelo} className="space-y-4 pt-2">
          {creacionError && (
            <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-900 text-xs">
              {creacionError}
            </div>
          )}

          <div>
            <Label required>Nombre del Modelo</Label>
            <Input
              placeholder="Ej: iPhone 19 Pro Max"
              value={nuevoNombreModelo}
              onChange={(e) => setNuevoNombreModelo(e.target.value)}
            />
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <p className="text-xs font-bold text-slate-900">
              Primera Variante Obligatoria (Invariante)
            </p>

            <div>
              <Label required>Color de Lanzamiento</Label>
              <Input
                placeholder="Ej: Titanium Silver, Space Black"
                value={primeraVarColor}
                onChange={(e) => setPrimeraVarColor(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Capacidad</Label>
                <Select
                  value={primeraVarCapacidad}
                  onChange={(e) => setPrimeraVarCapacidad(Number(e.target.value))}
                >
                  <option value="128">128 GB</option>
                  <option value="256">256 GB</option>
                  <option value="512">512 GB</option>
                  <option value="1024">1 TB</option>
                  <option value="2048">2 TB</option>
                </Select>
              </div>

              <div>
                <Label required>Tipo SIM</Label>
                <Select
                  value={primeraVarSim}
                  onChange={(e) => setPrimeraVarSim(e.target.value)}
                >
                  <option value="SIM Físico">SIM Físico</option>
                  <option value="eSIM Exclusivo">eSIM Exclusivo</option>
                  <option value="Dual SIM Físico">Dual SIM Físico</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setModalNuevoModeloOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isCreatingModelo}
              disabled={!nuevoNombreModelo.trim() || !primeraVarColor.trim()}
            >
              Crear Modelo Atómico
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Interactivo de Línea de Vida por IMEI (US18) */}
      <ModalLineaVida
        isOpen={Boolean(selectedImeiForLifeline)}
        onClose={() => setSelectedImeiForLifeline(null)}
        imei={selectedImeiForLifeline}
      />
    </div>
  );
}
