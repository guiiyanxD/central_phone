'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Lock, Mail, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm space-y-6">
        {/* Identidad de Marca */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle p-2">
            <Image
              src="/logo.png"
              alt="CentralPhone Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              CentralPhone
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Plataforma de Gestión Comercial & Inventario Serializado
            </p>
          </div>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="p-6 pb-2 text-center">
            <CardTitle className="text-base font-bold text-slate-900">
              Acceso al Sistema
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Ingresa tus credenciales autorizadas de usuario.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-4 space-y-5">
            {errorMsg && (
              <div className="rounded-lg border border-slate-300 bg-white p-3 text-xs text-rose-700 flex items-start gap-2 shadow-sm animate-in fade-in">
                <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label required>Correo Electrónico</Label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="usuario@centralphone.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <Label required>Contraseña</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full text-xs font-semibold h-10 mt-2"
                isLoading={isLoading}
                loadingText="Verificando credenciales..."
              >
                <span>Ingresar al Sistema</span>
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Seguro */}
        <p className="text-center text-[11px] text-slate-400">
          CentralPhone POS • Sesión protegida mediante JWT
        </p>
      </div>
    </div>
  );
}
