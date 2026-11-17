'use client';

import React, { useState, useEffect } from 'react';
import {
  Pencil,
  User,
  Phone,
  Battery,
  CalendarClock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Smartphone,
  DollarSign,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

export interface DispositivoEditItem {
  id: number;
  modeloNombre: string;
  varianteNombre: string;
  porcentajeBateria: number | '';
  detallesFisicos: string;
  costoBs: number | '';
  numeroSerie: string;
  imei1: string;
  imei2: string;
  estadoInventario: string;
  isSold: boolean;
}

interface ModalEditarPermutaProps {
  isOpen: boolean;
  onClose: () => void;
  permuta: any | null;
  onSuccess: () => void;
  isAdmin?: boolean;
}

export function ModalEditarPermuta({
  isOpen,
  onClose,
  permuta,
  onSuccess,
  isAdmin = false,
}: ModalEditarPermutaProps) {
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lista de dispositivos a editar
  const [dispositivos, setDispositivos] = useState<DispositivoEditItem[]>([]);
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);

  useEffect(() => {
    if (permuta) {
      setErrorMsg(null);
      setNombreCliente(permuta.proveedor?.nombre || '');
      setTelefonoCliente(permuta.proveedor?.telefono || '');
      setObservaciones(permuta.observaciones || '');

      const dispList: DispositivoEditItem[] = Array.isArray(permuta.dispositivos)
        ? permuta.dispositivos.map((d: any) => {
            const isSold =
              d.estadoInventario === 'VENDIDO' || (Array.isArray(d.detalleVentas) && d.detalleVentas.length > 0);
            const modelo = d.variante?.modelo?.nombreModelo || 'iPhone';
            const capGb = d.variante?.capacidadGb || 0;
            const capStr = capGb >= 1024 ? `${capGb / 1024}TB` : capGb > 0 ? `${capGb}GB` : '';
            const varStr = `${d.variante?.color || ''} ${capStr}`.trim();

            return {
              id: d.id,
              modeloNombre: modelo,
              varianteNombre: varStr,
              porcentajeBateria: d.porcentajeBateria || 100,
              detallesFisicos: d.detallesFisicos || '',
              costoBs: d.costoBs !== undefined && d.costoBs !== null ? Number(d.costoBs) : '',
              numeroSerie: d.numeroSerie || '',
              imei1: d.imei1 || '',
              imei2: d.imei2 || '',
              estadoInventario: d.estadoInventario || 'DISPONIBLE',
              isSold,
            };
          })
        : [];

      setDispositivos(dispList);
      setSelectedTabIdx(0);

      if (permuta.fechaIngreso) {
        const d = new Date(permuta.fechaIngreso);
        const pad = (n: number) => String(n).padStart(2, '0');
        setFechaIngreso(
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        );
      } else {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        setFechaIngreso(
          `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
        );
      }
    }
  }, [permuta]);

  const updateSelectedDevice = (field: keyof DispositivoEditItem, val: any) => {
    setDispositivos((prev) => {
      const copy = [...prev];
      if (!copy[selectedTabIdx]) return prev;
      copy[selectedTabIdx] = { ...copy[selectedTabIdx], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permuta) return;

    if (!nombreCliente.trim()) {
      setErrorMsg('El nombre del cliente es obligatorio.');
      return;
    }

    if (!telefonoCliente.trim()) {
      setErrorMsg('El teléfono del cliente es obligatorio.');
      return;
    }

    // Validar dispositivos
    for (let i = 0; i < dispositivos.length; i++) {
      const d = dispositivos[i];
      if (d.porcentajeBateria === '' || d.porcentajeBateria < 1 || d.porcentajeBateria > 100) {
        setErrorMsg(`El porcentaje de batería del equipo #${i + 1} (${d.modeloNombre}) debe estar entre 1% y 100%.`);
        return;
      }
      if (isAdmin && (typeof d.costoBs !== 'number' || d.costoBs <= 0)) {
        setErrorMsg(`El costo de compra del equipo #${i + 1} (${d.modeloNombre}) debe ser un número mayor a 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const dispositivosPayload = dispositivos.map((d) => ({
        id: d.id,
        porcentajeBateria: Number(d.porcentajeBateria),
        detallesFisicos: d.detallesFisicos.trim() || undefined,
        ...(isAdmin && typeof d.costoBs === 'number' ? { costoBs: d.costoBs } : {}),
        numeroSerie: d.numeroSerie.trim() || undefined,
        imei1: d.imei1.trim() || undefined,
        imei2: d.imei2.trim() || undefined,
      }));

      const payload: any = {
        proveedorMinorista: {
          nombre: nombreCliente.trim(),
          telefono: telefonoCliente.trim(),
        },
        observaciones: observaciones.trim() || undefined,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso).toISOString() : undefined,
        dispositivos: dispositivosPayload,
        // Compatibilidad hacia atrás:
        dispositivo: dispositivosPayload[0] || {
          porcentajeBateria: 100,
        },
      };

      await api.recepcion.updatePermuta(permuta.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar los datos de la permuta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxDateTimeLocal = React.useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, []);

  const currentDisp = dispositivos[selectedTabIdx];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <Pencil className="h-5 w-5 text-purple-700" />
          <span>Editar Permuta #ING-{permuta?.id}</span>
        </div>
      }
      description={`Modifica los datos del cliente, batería, fecha u observaciones de esta permuta (${dispositivos.length} ${dispositivos.length === 1 ? 'iPhone' : 'iPhones'}).`}
      className="max-w-2xl p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {errorMsg && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 flex items-start gap-2 shadow-xs">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="flex-1">{errorMsg}</p>
          </div>
        )}

        {/* 1. Datos del Cliente */}
        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <User className="h-3.5 w-3.5 text-purple-700" />
            <span>Datos del Cliente / Proveedor Minorista</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="editNombreCliente" className="text-xs mb-1 block">
                Nombre del Cliente <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="editNombreCliente"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                className="text-xs h-9"
                placeholder="Ej: Carlos Mamani"
                autoFocus
                required
              />
            </div>

            <div>
              <Label htmlFor="editTelefonoCliente" className="text-xs mb-1 block">
                Teléfono de Contacto <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="editTelefonoCliente"
                type="tel"
                value={telefonoCliente}
                onChange={(e) => setTelefonoCliente(e.target.value)}
                className="text-xs h-9 font-mono"
                placeholder="Ej: 78912345"
                required
              />
            </div>
          </div>
        </div>

        {/* 2. Fecha y Observaciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="editFechaIngreso" className="text-xs flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                <span>Fecha y Hora de Recepción</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => {
                  const now = new Date();
                  const pad = (n: number) => String(n).padStart(2, '0');
                  setFechaIngreso(
                    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
                  );
                }}
              >
                Ahora
              </Button>
            </div>
            <Input
              id="editFechaIngreso"
              type="datetime-local"
              max={maxDateTimeLocal}
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              className="text-xs h-9 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="editObservaciones" className="text-xs mb-1 block">
              Observaciones de la Permuta
            </Label>
            <Input
              id="editObservaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Equipo verificado, pantalla original..."
              className="text-xs h-9"
            />
          </div>
        </div>

        {/* 3. Selector de Pestañas de Equipos */}
        {dispositivos.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-purple-700" />
                <span className="text-xs font-bold text-slate-900">
                  iPhones en esta Permuta ({dispositivos.length})
                </span>
              </div>
            </div>

            {/* Pestañas si hay más de 1 equipo */}
            {dispositivos.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {dispositivos.map((d, idx) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedTabIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                      selectedTabIdx === idx
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{idx + 1}. {d.modeloNombre}</span>
                    {d.isSold && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Vendido" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Tarjeta del Equipo Seleccionado */}
            {currentDisp && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {currentDisp.modeloNombre} {currentDisp.varianteNombre ? `(${currentDisp.varianteNombre})` : ''}
                  </span>
                  {currentDisp.isSold ? (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 font-bold">
                      VENDIDO (Datos bloqueados)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-medium">
                      DISPONIBLE
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Batería */}
                  <div>
                    <Label htmlFor="editBateria" className="text-xs mb-1 flex items-center gap-1">
                      <Battery className="h-3.5 w-3.5 text-slate-500" />
                      <span>Salud de Batería (%) <span className="text-rose-500">*</span></span>
                    </Label>
                    <Input
                      id="editBateria"
                      type="number"
                      min={1}
                      max={100}
                      disabled={currentDisp.isSold}
                      value={currentDisp.porcentajeBateria}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        updateSelectedDevice(
                          'porcentajeBateria',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      className="text-xs h-9 font-mono"
                      required
                    />
                  </div>

                  {/* Costo de Toma / Compra (Solo ADMIN) */}
                  <div>
                    <Label htmlFor="editCostoBs" className="text-xs mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-semibold text-purple-950">
                        <DollarSign className="h-3.5 w-3.5 text-purple-700" />
                        <span>Costo de Toma (Bs)</span>
                      </span>
                      {!isAdmin && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> Solo Admin
                        </span>
                      )}
                    </Label>
                    <Input
                      id="editCostoBs"
                      type="number"
                      min={1}
                      step="any"
                      disabled={!isAdmin || currentDisp.isSold}
                      value={currentDisp.costoBs}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        updateSelectedDevice(
                          'costoBs',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      className={`text-xs h-9 font-mono font-bold ${
                        !isAdmin ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900'
                      }`}
                      title={!isAdmin ? 'Solo el administrador puede modificar el costo de compra.' : undefined}
                    />
                  </div>

                  {/* Número de Serie */}
                  <div>
                    <Label htmlFor="editSerie" className="text-xs mb-1 block">
                      Número de Serie
                    </Label>
                    <Input
                      id="editSerie"
                      disabled={currentDisp.isSold}
                      value={currentDisp.numeroSerie}
                      onChange={(e) => updateSelectedDevice('numeroSerie', e.target.value)}
                      className="text-xs h-9 font-mono uppercase"
                    />
                  </div>

                  {/* IMEI 1 */}
                  <div>
                    <Label htmlFor="editImei1" className="text-xs mb-1 block">
                      IMEI 1
                    </Label>
                    <Input
                      id="editImei1"
                      disabled={currentDisp.isSold}
                      value={currentDisp.imei1}
                      onChange={(e) => updateSelectedDevice('imei1', e.target.value)}
                      className="text-xs h-9 font-mono"
                    />
                  </div>

                  {/* Registro / Situación de Liberación */}
                  <div className="sm:col-span-2">
                    <Label htmlFor="editRegistro" className="text-xs mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                        <span>Registro <span className="text-slate-400 font-normal">(Operador / Liberación)</span></span>
                      </span>
                    </Label>
                    <Input
                      id="editRegistro"
                      disabled={currentDisp.isSold}
                      value={currentDisp.detallesFisicos}
                      onChange={(e) => updateSelectedDevice('detallesFisicos', e.target.value)}
                      placeholder="Ej: Liberado de fábrica / Bloqueado AT&T / R-SIM"
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="text-xs bg-purple-700 hover:bg-purple-800 text-white font-semibold"
          >
            {isSubmitting ? 'Guardando cambios...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
