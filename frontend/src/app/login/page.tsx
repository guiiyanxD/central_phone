'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './login-lava.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 lg:p-6 lg:bg-[#F8FAFC] overflow-hidden select-none">
      {/* Filtro SVG Goo para la Fusión Orgánica de los Blobs de Lava (Compatible con WebKit sin 'invisible') */}
      <svg
        width="0"
        height="0"
        className="absolute -top-[9999px] -left-[9999px] w-0 h-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
          />
        </filter>
      </svg>

      {/* =========================================================================
          TELÓN DE FONDO INMERSIVO EN MÓVILES (< lg): Lava Lamp Burgundy a pantalla completa
          ========================================================================= */}
      <div className="lava-backdrop-mobile lg:hidden" aria-hidden="true">
        <div className="lava-container">
          <div className="lava-pool" />
          <div className="lava-blob lava-b1" />
          <div className="lava-blob lava-b2" />
          <div className="lava-blob lava-b3" />
          <div className="lava-blob lava-b4" />
          <div className="lava-blob lava-b5" />
        </div>
        <div className="lava-glow" />
      </div>

      {/* Tarjeta Principal: Elevada sobre la Lava en Móvil y Split-Screen 50/50 en Desktop */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-5xl my-auto bg-[#F8FAFC] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55),0_10px_20px_-8px_rgba(0,0,0,0.35)] lg:shadow-2xl lg:shadow-slate-900/15 ring-1 ring-white/25 lg:ring-slate-900/5 border border-white/25 lg:border-slate-200/80 overflow-hidden flex flex-col lg:grid lg:grid-cols-2 lg:max-h-[min(620px,94vh)]">
        {/* =========================================================================
            PANEL DEL FORMULARIO: Autenticación con Identidad Centrada (Único panel en móvil)
            ========================================================================= */}
        <div className="p-5 sm:p-7 lg:p-10 flex flex-col justify-between bg-[#F8FAFC] flex-1 overflow-hidden">
          <div className="space-y-4 my-auto">
            {/* 1. Identidad de Marca Oficial: Logo y Nombre Centrados por Encima */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative h-11 w-11 sm:h-13 sm:w-13 rounded-2xl bg-[#F8FAFC] border border-slate-200 p-2 shadow-md shadow-slate-900/5 flex items-center justify-center mb-2 transition-transform hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="CentralPhone Logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900">
                CentralPhone
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                Ecosistema Oficial de Gestión Comercial
              </p>
            </div>

            {/* 2. Título de Sección */}
            <div className="space-y-0.5 text-center sm:text-left">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-900">
                Acceso al Sistema
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Ingresa tus credenciales autorizadas de usuario para iniciar tu turno.
              </p>
            </div>

            {/* 3. Alerta de Error de Credenciales */}
            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50/95 p-2.5 text-xs text-rose-700 flex items-start gap-2 shadow-sm animate-in fade-in"
              >
                <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* 4. Formulario de Login */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="email" required>
                  Correo Electrónico
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="usuario@centralphone.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="pl-9 text-xs h-9 sm:h-10 bg-[#F8FAFC] border-slate-300 focus-visible:bg-[#F8FAFC] focus-visible:ring-[#8c1d40] focus-visible:border-[#8c1d40]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" required>
                  Contraseña
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 pr-10 text-xs h-9 sm:h-10 bg-[#F8FAFC] border-slate-300 focus-visible:bg-[#F8FAFC] focus-visible:ring-[#8c1d40] focus-visible:border-[#8c1d40]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2.5 top-2 sm:top-2.5 p-1 text-slate-400 hover:text-slate-700 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8c1d40]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xs font-semibold h-10 mt-1 bg-[#8c1d40] hover:bg-[#731533] active:bg-[#5b0f27] text-white shadow-md transition-colors"
                isLoading={isLoading}
                loadingText="Verificando credenciales..."
              >
                <span>Ingresar al Sistema</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* 5. Pie de Seguridad */}
          <div className="pt-2.5 border-t border-slate-200/70 mt-3">
            <p className="text-center text-[10px] text-slate-400 font-medium">
              CentralPhone POS • Sesión protegida mediante JWT & RBAC
            </p>
          </div>
        </div>

        {/* =========================================================================
            PANEL DERECHO: Hero Visual con Efecto Lava Lamp "iPhone 18 Burgundy"
            Estrictamente visible solo en Desktop (lg:block), 50% split-screen
            ========================================================================= */}
        <div className="hidden lg:flex relative lava-hero w-full h-full min-h-[480px] flex-col justify-between">
          {/* Animación de Fluido Orgánico Lava */}
          <div className="lava-container" aria-hidden="true">
            <div className="lava-pool" />
            <div className="lava-blob lava-b1" />
            <div className="lava-blob lava-b2" />
            <div className="lava-blob lava-b3" />
            <div className="lava-blob lava-b4" />
            <div className="lava-blob lava-b5" />
          </div>

          {/* Resplandor y Gradiente Radial */}
          <div className="lava-glow" />

          {/* Mensaje Editorial en Champagne Gold (#e6c594) */}
          <div className="relative z-10 p-8 sm:p-10 lg:p-12 flex flex-col justify-between h-full text-[#e6c594]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[#e6c594]/10 border border-[#e6c594]/30 backdrop-blur-md shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#e6c594]" />
                <span>iPhone 18 Burgundy Edition</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight leading-[1.12] drop-shadow-[0_2px_24px_rgba(40,5,15,0.7)]">
                Potencia.<br />
                Elegancia.<br />
                <span className="font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">CentralPhone.</span>
              </h2>

              <p className="text-xs sm:text-sm text-[#e6c594]/90 max-w-sm font-normal leading-relaxed drop-shadow-[0_1px_8px_rgba(20,5,10,0.6)]">
                Ecosistema oficial de gestión comercial y punto de venta de alta velocidad.
              </p>
            </div>

            <div className="pt-6 border-t border-[#e6c594]/20 flex items-center justify-between text-[11px] text-[#e6c594]/80 tracking-wide font-medium">
              <span>Edición Especial 2026</span>
              <span>v4.0 Pro POS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
