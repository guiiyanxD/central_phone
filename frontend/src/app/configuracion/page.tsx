'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  QrCode,
  Building2,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  const [config, setConfig] = useState<any>(null);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Campos editables (solo Admin)
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nit, setNit] = useState('');
  const [telefonoPrincipal, setTelefonoPrincipal] = useState('');
  const [banco, setBanco] = useState('');
  const [titular, setTitular] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [configData, sucData] = await Promise.all([
          api.configuracion.get(),
          api.sucursales.getAll(),
        ]);
        setConfig(configData);
        setSucursales(sucData);

        if (configData) {
          setNombreEmpresa(configData.nombreEmpresa || 'CentralPhone');
          setNit(configData.nit || '');
          setTelefonoPrincipal(configData.telefonoPrincipal || '');
          setBanco(configData.bancoOficial || '');
          setTitular(configData.titularCuenta || '');
          setNumeroCuenta(configData.numeroCuenta || '');
          setQrUrl(configData.qrOficialImagenUrl || configData.qrOficialUrl || '');
        }
      } catch (err: any) {
        setSaveError('Error al cargar la configuración corporativa.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Manejador de carga y sanitización de imagen para el QR oficial
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación estricta de MIME en cliente (bloqueo total a SVG, HTML y binarios)
    const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setSaveError(
        'Formato no permitido. Solo se aceptan archivos de imagen PNG, JPEG o WEBP (los archivos SVG, HTML o scripts están estrictamente prohibidos).'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validación de tamaño (máx 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setSaveError('El archivo es demasiado grande. El límite máximo permitido es 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setSaveError('Error al leer el archivo seleccionado.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        try {
          // Normalizar resolución máxima a 800x800 manteniendo relación de aspecto
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('No se pudo inicializar el contexto de imagen.');
          }

          // Re-rasterizar en el canvas: esto purga metadatos EXIF y desactiva vectores maliciosos
          ctx.drawImage(img, 0, 0, width, height);

          // Exportar como PNG rasterizado seguro
          const cleanBase64 = canvas.toDataURL('image/png');
          setQrUrl(cleanBase64);
          setSaveError(null);
        } catch (err: any) {
          setSaveError('Error al procesar la imagen: ' + (err.message || 'Lienzo no disponible'));
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      img.onerror = () => {
        setSaveError('El archivo seleccionado no es una imagen válida o contiene datos corruptos.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await api.configuracion.update({
        nombreEmpresa,
        qrOficialImagenUrl: qrUrl,
        bancoOficial: banco,
        titularCuenta: titular,
        numeroCuenta: numeroCuenta,
        tipoCuenta: 'Caja de Ahorro Bs',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Error al actualizar la configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Configuración del Negocio & QR Oficial
          </h1>
          <Badge variant={isAdmin ? 'default' : 'secondary'}>
            {isAdmin ? 'Acceso Administrador' : 'Modo Vendedor (Solo Lectura)'}
          </Badge>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Parámetros corporativos globales, carga de imagen oficial de SIMPLE QR y sucursales.
        </p>
      </div>

      {/* Banner Informativo Anti-Fraude (Monocromo / Alta Gama) */}
      {!isAdmin ? (
        <div className="rounded-xl border border-slate-300 bg-white p-4 text-xs text-slate-900 flex items-start gap-3 shadow-sm">
          <Lock className="h-4 w-4 text-slate-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Seguridad Anti-Fraude Activa (Regla Inmutable)</p>
            <p className="mt-0.5 text-slate-600">
              Como vendedor, cuentas con acceso de solo lectura para proyectar el QR oficial al cliente.
              La alteración de la cuenta receptora o reemplazo del código QR requiere credenciales de Administrador.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-300 bg-white p-4 text-xs text-slate-900 flex items-start gap-3 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-slate-900 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Privilegios de Administración Habilitados</p>
            <p className="mt-0.5 text-slate-600">
              Cualquier cambio en la cuenta bancaria o imagen del QR se sincroniza de inmediato en todas las terminales de Punto de Venta.
            </p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-xl border border-slate-300 bg-white p-4 text-xs text-slate-900 flex items-center gap-2 shadow-sm animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 text-slate-900" />
          <span className="font-semibold">Configuración corporativa y código QR guardados exitosamente.</span>
        </div>
      )}

      {saveError && (
        <div className="rounded-xl border border-slate-300 bg-white p-4 text-xs text-rose-700 flex items-center gap-2 shadow-sm">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>{saveError}</span>
        </div>
      )}

      {/* SECCIÓN 1: DATOS BANCARIOS Y CARGA DE IMAGEN DEL QR (US03 / US15) */}
      <form onSubmit={handleSaveConfig} className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-slate-800" />
              <CardTitle className="text-base font-semibold text-slate-900">
                Canal Oficial de Cobro QR (BCP Bolivia)
              </CardTitle>
            </div>
            <Badge variant="outline">SIMPLE QR Oficial</Badge>
          </CardHeader>

          <CardContent className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Proyección y Carga de la Imagen del QR */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-center space-y-3">
                <div className="relative w-44 h-44 bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center shadow-subtle overflow-hidden">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="Código QR Oficial"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 space-y-2 text-slate-400">
                      <ImageIcon className="h-10 w-10 mx-auto" />
                      <p className="text-[10px]">Sin imagen de QR cargada</p>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold text-slate-900">{titular || 'Alex Gomez'}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{numeroCuenta || '201-50893214-3-12'}</p>
                </div>

                {isAdmin && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Subir Imagen QR
                    </Button>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG o WEBP</p>
                  </div>
                )}
              </div>

              {/* Formulario de Datos Bancarios */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label>Entidad Bancaria</Label>
                  <Input
                    disabled={!isAdmin}
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    placeholder="Banco de Crédito BCP"
                  />
                </div>

                <div>
                  <Label>Titular de la Cuenta Corporativa</Label>
                  <Input
                    disabled={!isAdmin}
                    value={titular}
                    onChange={(e) => setTitular(e.target.value)}
                    placeholder="Alex Gomez"
                  />
                </div>

                <div>
                  <Label>Número de Cuenta Bancaria</Label>
                  <Input
                    disabled={!isAdmin}
                    value={numeroCuenta}
                    onChange={(e) => setNumeroCuenta(e.target.value)}
                    placeholder="201-50893214-3-12"
                  />
                </div>
              </div>
            </div>

            {/* Datos de Empresa */}
            <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Nombre Comercial</Label>
                <Input
                  disabled={!isAdmin}
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                />
              </div>

              <div>
                <Label>NIT / CI</Label>
                <Input
                  disabled={!isAdmin}
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                />
              </div>

              <div>
                <Label>Teléfono Central</Label>
                <Input
                  disabled={!isAdmin}
                  value={telefonoPrincipal}
                  onChange={(e) => setTelefonoPrincipal(e.target.value)}
                />
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  isLoading={isSaving}
                  loadingText="Guardando cambios..."
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  Guardar Configuración & QR Oficial
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>

      {/* SECCIÓN 2: GESTIÓN DE SUCURSALES (US04) */}
      <Card className="border-slate-200">
        <CardHeader className="p-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-800" />
            <CardTitle className="text-base font-semibold text-slate-900">
              Sucursales Operativas de CentralPhone
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Cada sucursal gestiona su propio inventario físico y sus propias sesiones de caja diaria.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sucursales.map((suc) => (
              <div
                key={suc.id}
                className="p-4 rounded-xl border border-slate-200 bg-white flex items-start justify-between shadow-subtle"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{suc.nombre}</p>
                    <Badge variant="outline" className="text-[10px]">Operativa</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{suc.direccion}</p>
                  <p className="text-[11px] text-slate-500">
                    {suc.ciudad} • Tel: {suc.telefono}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
