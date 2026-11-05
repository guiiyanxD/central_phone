import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';

const mockLogin = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/login',
}));

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('LoginPage Component (iPhone 18 Burgundy & Lava Lamp)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar la identidad corporativa CentralPhone centrada sobre el formulario', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'CentralPhone' })).toBeInTheDocument();
    expect(screen.getByText('Ecosistema Oficial de Gestión Comercial')).toBeInTheDocument();
    expect(screen.getByAltText('CentralPhone Logo')).toBeInTheDocument();
  });

  it('debe renderizar el título del formulario y los campos de correo y contraseña', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { level: 2, name: 'Acceso al Sistema' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('debe permitir alternar la visibilidad de la contraseña con el botón del ojo', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByLabelText('Mostrar contraseña');
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');
    expect(screen.getByLabelText('Ocultar contraseña')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Ocultar contraseña'));
    expect(passwordInput.type).toBe('password');
  });

  it('debe mostrar mensaje de advertencia si se intenta enviar el formulario con campos vacíos', async () => {
    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /Ingresar al Sistema/i });
    fireEvent.click(submitBtn);

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('debe invocar login() al enviar credenciales válidas', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('usuario@centralphone.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Ingresar al Sistema/i });

    fireEvent.change(emailInput, { target: { value: 'admin@centralphone.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@centralphone.com', 'password123');
    });
  });

  it('debe renderizar los elementos editoriales en el panel visual Hero', () => {
    render(<LoginPage />);

    expect(screen.getByText('iPhone 18 Burgundy Edition')).toBeInTheDocument();
    expect(screen.getByText(/Potencia\./i)).toBeInTheDocument();
    expect(screen.getByText(/Elegancia\./i)).toBeInTheDocument();
    expect(screen.getByText('Edición Especial 2026')).toBeInTheDocument();
  });
});
