import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'CentralPhone - Gestión Comercial & Inventario Serializado',
  description: 'Sistema empresarial de gestión comercial, inventario por IMEI y control de caja para CentralPhone.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-[#363EFF] selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
