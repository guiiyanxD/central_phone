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
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

interface ModalEditarPermutaProps {
  isOpen: boolean;
  onClose: () => void;
  permuta: any | null;
  onSuccess: () => void;
}

export function ModalEditarPermuta({
  isOpen,
  onClose,
  permuta,
  onSuccess,
}: ModalEditarPermutaProps) {
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [porcentajeBateria, setPorcentajeBateria] = useState<number>(100);
  const [registro, setRegistro] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (permuta) {
      setErrorMsg(null);
      setNombreCliente(permuta.proveedor?.nombre || '');
      setTelefonoCliente(permuta.proveedor?.telefono || '');
      const disp = permuta.dispositivos?.[0];
      setPorcentajeBateria(disp?.porcentajeBateria || 100);
      setRegistro(disp?.detallesFisicos || '');
      setObservaciones(permuta.observaciones || '');

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

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        proveedorMinorista: {
          nombre: nombreCliente.trim(),
          telefono: telefonoCliente.trim(),
        },
        dispositivo: {
          porcentajeBateria: Number(porcentajeBateria),
          detallesFisicos: registro.trim() || undefined,
        },
        observaciones: observaciones.trim() || undefined,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso).toISOString() : undefined,
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

  const disp = permuta?.dispositivos?.[0];

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
      description={`Modifica los datos del cliente, batería, fecha u observaciones de esta permuta (${disp?.variante?.modelo?.nombreModelo || 'iPhone'}).`}
      className="max-w-lg p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {errorMsg && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 flex items-start gap-2 shadow-xs">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="flex-1">{errorMsg}</p>
          </div>
        )}

        {/* Cliente */}
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

        {/* Fecha y Hora */}
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
              className="h-5 text-[10px] px-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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

        {/* Batería */}
        <div>
          <Label htmlFor="editBateria" className="text-xs mb-1 block flex items-center gap-1">
            <Battery className="h-3.5 w-3.5 text-slate-500" />
            <span>Porcentaje de Salud de Batería (%)</span>
          </Label>
          <Input
            id="editBateria"
            type="number"
            min={1}
            max={100}
            value={porcentajeBateria}
            onChange={(e) => setPorcentajeBateria(Number(e.target.value))}
            className="text-xs h-9 font-mono w-32"
          />
        </div>

        {/* Registro (Situación de Liberación) */}
        <div>
          <Label htmlFor="editRegistro" className="text-xs mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>Registro <span className="text-slate-400 font-normal">(Situación de liberación)</span></span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
          </Label>
          <Input
            id="editRegistro"
            value={registro}
            onChange={(e) => setRegistro(e.target.value)}
            placeholder="Ej: Liberado de fábrica / Bloqueado AT&T / R-SIM"
            className="text-xs h-9"
          />
        </div>

        {/* Observaciones */}
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
