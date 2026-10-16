'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-300">
      {/* Contenedor Flotante Split-Card (Inspirado en el diseño de referencia) */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* =========================================================================
            PANEL IZQUIERDO: Hero Artístico con Textura Líquida Orgánica y Grano Fino
            (Replica exacta de docs/requerimientos/login_example.webp)
            ========================================================================= */}
        <div className="lg:col-span-5 relative p-6 sm:p-8 flex flex-col justify-between min-h-[460px] lg:min-h-[600px] bg-slate-950 text-white overflow-hidden">
          {/* Fondo de alta resolución con textura fluida de seda en azul cobalto y flama */}
          <div className="absolute inset-0">
            <Image
              src="/images/auth-hero-exact.webp"
              alt="Textura fluida artística CentralPhone"
              fill
              className="object-cover object-center scale-105"
              priority
            />
            {/* Gradiente sutil para garantizar contraste y legibilidad absoluta */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/60" />
          </div>

          {/* Badge superior: Ecosistema Oficial */}
          <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/50 backdrop-blur-md border border-white/15 w-fit text-xs font-medium text-white/95 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Ecosistema CentralPhone</span>
          </div>

          {/* Tarjeta Central Glassmorphism: Identidad y Promesa de Valor */}
          <div className="relative z-10 p-5 sm:p-6 rounded-2xl bg-slate-950/65 backdrop-blur-md border border-white/15 shadow-2xl space-y-3.5 my-auto">
            <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-[#363EFF] to-[#F97316] text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                Control y Trazabilidad de Alta Precisión
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                Gestión unificada de inventario serializado por IMEI, arqueo de caja a ciegas y emisión instantánea de comprobantes térmicos.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-medium text-slate-200">
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/10 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Control IMEI
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/10 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" /> POS Ultrarrápido
              </span>
            </div>
          </div>

          {/* Indicadores de Carrusel Inferior (Estilo exacto de login_example.webp) */}
          <div className="relative z-10 flex items-center gap-2 pt-2">
            <div className="h-1.5 w-7 rounded-full bg-white transition-all shadow-sm" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>

        {/* =========================================================================
            PANEL DERECHO: Formulario de Autenticación & Acceso Rápido POS
            ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div className="space-y-6">
            {/* Header de Identidad de Marca */}
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle p-1.5 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="CentralPhone Logo"
                  fill
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                  CentralPhone
                </h1>
                <p className="text-xs text-slate-500">
                  Terminal Oficial de Mostrador & Inventario
                </p>
              </div>
            </div>

            {/* Título de la Sección */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Acceso al Sistema
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa tus credenciales autorizadas para abrir tu turno operativo.
              </p>
            </div>

            {/* Alerta de Error de Credenciales */}
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-700 flex items-start gap-2.5 shadow-sm animate-in fade-in">
                <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Acceso Rápido para Demostración y Pruebas Operativas */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Acceso Rápido por Rol
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@centralphone.com');
                    setPassword('admin123456');
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#363EFF]/5 hover:border-[#363EFF]/30 hover:text-[#363EFF] text-slate-700 transition-all text-center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#363EFF]" />
                  <span>Administrador</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('vendedor@centralphone.com');
                    setPassword('vendedor123');
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#F97316]/5 hover:border-[#F97316]/30 hover:text-[#F97316] text-slate-700 transition-all text-center"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Vendedor POS</span>
                </button>
              </div>
            </div>

            {/* Formulario de Login */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div>
                <Label required>Correo Electrónico</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="usuario@centralphone.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label required>Contraseña</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xs font-semibold h-11 mt-2 bg-[#363EFF] hover:bg-[#2B32E0] shadow-md shadow-[#363EFF]/25 text-white"
                isLoading={isLoading}
                loadingText="Verificando credenciales..."
              >
                <span>Ingresar al Sistema</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Footer de Seguridad */}
          <div className="pt-6 border-t border-slate-100 mt-6">
            <p className="text-center text-[11px] text-slate-400">
              CentralPhone POS • Sesión protegida mediante JWT & RBAC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
