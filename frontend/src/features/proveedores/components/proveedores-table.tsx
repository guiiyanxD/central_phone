'use client';

import React from 'react';
import {
  Building2,
  User,
  Phone,
  Edit,
  PowerOff,
  Power,
  Package,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProveedorItem } from '../types';

interface ProveedoresTableProps {
  proveedores: ProveedorItem[];
  onEdit: (proveedor: ProveedorItem) => void;
  onToggleStatus: (proveedor: ProveedorItem) => void;
  onVerDetalle: (proveedor: ProveedorItem) => void;
}

export function ProveedoresTable({
  proveedores,
  onEdit,
  onToggleStatus,
  onVerDetalle,
}: ProveedoresTableProps) {
  if (proveedores.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-subtle">
        <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Truck className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          No se encontraron proveedores
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No hay proveedores mayoristas registrados que coincidan con la búsqueda o aún no has registrado contactos de mercadería.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Proveedor Mayorista
              </th>
              <th scope="col" className="px-5 py-3.5">
                Contacto Comercial
              </th>
              <th scope="col" className="px-5 py-3.5">
                Teléfono / WhatsApp
              </th>
              <th scope="col" className="px-5 py-3.5 text-center">
                Recepciones
              </th>
              <th scope="col" className="px-5 py-3.5">
                Estado
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proveedores.map((p) => {
              const totalNotas = p._count?.notasIngreso ?? 0;
              const cleanPhone = (p.telefono || '').replace(/\D/g, '');

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    !p.activo ? 'bg-slate-50/40 opacity-75' : ''
                  }`}
                >
                  {/* Empresa / Proveedor */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {p.empresa ? (
                          <Building2 className="h-4 w-4 text-slate-600" />
                        ) : (
                          <User className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{p.empresa || `${p.nombre} ${p.apellido || ''}`}</span>
                        </div>
                        {p.empresa && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Razón Social / Empresa
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contacto Comercial */}
                  <td className="px-5 py-4">
                    <div>
                      <span className="font-medium text-slate-800">
                        {p.nombre} {p.apellido || ''}
                      </span>
                      {p.contactoReferencia && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          {p.contactoReferencia}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Teléfono / WhatsApp */}
                  <td className="px-5 py-4">
                    {p.telefono ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{p.telefono}</span>
                        {cleanPhone.length >= 7 && (
                          <a
                            href={`https://wa.me/591${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 ml-1 inline-flex items-center"
                            title="Contactar vía WhatsApp"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No registrado</span>
                    )}
                  </td>

                  {/* Recepciones asociadas */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => onVerDetalle(p)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Ver historial de notas de ingreso"
                    >
                      <Package className="h-3.5 w-3.5 text-slate-500" />
                      <span>{totalNotas} {totalNotas === 1 ? 'nota' : 'notas'}</span>
                    </button>
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-4">
                    {p.activo ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Activo</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-slate-500">
                        <XCircle className="h-3 w-3" />
                        <span>Pausado</span>
                      </Badge>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Ver detalle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVerDetalle(p)}
                        title="Ver detalle del proveedor"
                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Detalle {p.nombre}</span>
                      </Button>

                      {/* Editar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(p)}
                        title="Editar datos del proveedor"
                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar {p.nombre}</span>
                      </Button>

                      {/* Alternar estado */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus(p)}
                        title={p.activo ? 'Desactivar proveedor' : 'Reactivar proveedor'}
                        className={`h-8 w-8 p-0 ${
                          p.activo
                            ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {p.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        <span className="sr-only">
                          {p.activo ? 'Pausar' : 'Activar'} {p.nombre}
                        </span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
