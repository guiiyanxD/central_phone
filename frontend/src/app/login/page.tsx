'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-2 sm:p-6 lg:p-10 animate-in fade-in duration-300">
      {/* Contenedor Flotante Ampliado (Sincronizado con login_example.webp) */}
      <div className="w-full max-w-md lg:max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* =========================================================================
            PANEL IZQUIERDO: Hero Artístico con Textura Líquida Orgánica
            Visible en Desktop / Tablets amplias (lg:flex)
            ========================================================================= */}
        <div className="hidden lg:flex relative p-8 sm:p-12 lg:p-16 flex-col justify-center items-center text-center lg:min-h-[620px] bg-slate-950 text-white overflow-hidden select-none">
          {/* Fondo de alta resolución con textura fluida de seda en azul cobalto y flama */}
          <div className="absolute inset-0">
            <Image
              src="/images/auth-hero-exact.webp"
              alt="Arte visual oficial CentralPhone"
              fill
              className="object-cover object-center scale-105"
              priority
            />
            {/* Velo sutil para contraste estético */}
            <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[1px]" />
          </div>

          {/* Centro: Identidad Oficial en Blanco Hueso (#F8FAFC) */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4 max-w-xs sm:max-w-sm">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2.5 shadow-2xl flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="CentralPhone Logo"
                fill
                className="object-contain p-1.5 drop-shadow-md"
                priority
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC] drop-shadow-md">
              CentralPhone
            </h1>
            <p className="text-xs sm:text-sm text-[#F1F5F9]/80 font-normal tracking-wide">
              Ecosistema Oficial de Gestión Comercial
            </p>
          </div>
        </div>

        {/* =========================================================================
            PANEL DERECHO: Formulario de Autenticación POS
            Ingreso manual estricto (DoD Fase 1 de Seguridad - Cero Credenciales Expuestas)
            ========================================================================= */}
        <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-between bg-white">
          <div className="space-y-5 my-auto">
            {/* Cabecera de Marca para Móviles (< lg) para evitar scroll vertical */}
            <div className="lg:hidden flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="relative h-9 w-9 rounded-xl border border-slate-200 bg-white shadow-subtle flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="CentralPhone Logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 leading-tight">CentralPhone</p>
                <p className="text-[11px] text-slate-500 font-medium">Gestión Comercial & Mostrador</p>
              </div>
            </div>

            {/* Título de la Sección */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Acceso al Sistema
              </h2>
              <p className="text-xs text-slate-500">
                Ingresa tus credenciales autorizadas de usuario para iniciar tu turno.
              </p>
            </div>

            {/* Alerta de Error de Credenciales */}
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-700 flex items-start gap-2 shadow-sm animate-in fade-in">
                <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Formulario de Login Estándar y Seguro */}
            <form onSubmit={handleSubmit} className="space-y-3.5 pt-0.5">
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
                    className="pl-9 text-xs"
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
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xs font-semibold h-10 mt-1 bg-slate-900 hover:bg-slate-800 shadow-md text-white"
                isLoading={isLoading}
                loadingText="Verificando credenciales..."
              >
                <span>Ingresar al Sistema</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Footer de Seguridad y Cierre */}
          <div className="pt-4 border-t border-slate-100 mt-5">
            <p className="text-center text-[10px] text-slate-400">
              CentralPhone POS • Sesión protegida mediante JWT & RBAC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
