import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CajaMovimientosTurno } from './caja-movimientos-turno';

// Mock de la API
vi.mock('@/lib/api', () => ({
  api: {
    ventas: {
      anular: vi.fn(),
    },
    caja: {
      actualizarGasto: vi.fn(),
      eliminarGasto: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('CajaMovimientosTurno Component', () => {
  const mockVentaCompletada = {
    id: 101,
    fechaHora: '2026-11-09T14:30:00.000Z',
    estado: 'COMPLETADA',
    totalVentaBs: 1500,
    montoPermutaBs: 0,
    montoEfectivoBs: 1500,
    metodoPago: { id: 1, codigo: 'EFECTIVO', nombre: 'Efectivo' },
    cliente: { nombreCompleto: 'Juan Pérez' },
    detalles: [
      {
        dispositivo: {
          variante: {
            color: 'Negro',
            modelo: { nombreModelo: 'iPhone 13' },
          },
        },
        cantidad: 1,
      },
    ],
  };

  const mockVentaAnulada = {
    id: 102,
    fechaHora: '2026-11-09T15:00:00.000Z',
    estado: 'ANULADA',
    totalVentaBs: 800,
    montoPermutaBs: 0,
    montoEfectivoBs: 800,
    metodoPago: { id: 2, codigo: 'QR', nombre: 'QR Oficial' },
    cliente: { nombreCompleto: 'María Gómez' },
    detalles: [],
  };

  const mockGasto = {
    id: 201,
    concepto: 'Compra de bolsas térmicas',
    montoBs: 45,
    categoriaId: 1,
    categoria: { id: 1, nombre: 'Insumos y Limpieza' },
    usuario: { id: 2, nombre: 'Cajero Central' },
  };

  const mockSessionData = {
    caja: {
      id: 50,
      estado: 'ABIERTA',
      ventas: [mockVentaCompletada, mockVentaAnulada],
      gastosOperativos: [mockGasto],
    },
    resumenFinanciero: {
      saldoEfectivoEnCaja: 1800,
      totalVentasEfectivo: 1500,
      totalVentasDigitales: 0,
      totalGastosEfectivo: 45,
    },
  };

  const mockCategorias = [
    { id: 1, nombre: 'Insumos y Limpieza' },
    { id: 2, nombre: 'Servicios Básicos' },
  ];

  it('debe renderizar la lista de ventas y gastos menores', () => {
    render(
      <CajaMovimientosTurno
        sessionData={mockSessionData}
        isAdmin={false}
        isCajaAbierta={true}
        categoriasGasto={mockCategorias}
      />
    );

    // Debe mostrar los folios de las ventas
    expect(screen.getByText('#TK-000101')).toBeDefined();
    expect(screen.getByText('#TK-000102')).toBeDefined();
    expect(screen.getByText('Juan Pérez')).toBeDefined();
    expect(screen.getByText('María Gómez')).toBeDefined();

    // Debe mostrar el gasto menor
    expect(screen.getByText('Compra de bolsas térmicas')).toBeDefined();
    expect(screen.getByText('-Bs 45.00')).toBeDefined();
  });

  it('debe mostrar el botón de anular venta para ADMIN cuando la caja está abierta', () => {
    render(
      <CajaMovimientosTurno
        sessionData={mockSessionData}
        isAdmin={true}
        isCajaAbierta={true}
        categoriasGasto={mockCategorias}
      />
    );

    // Venta completada debe tener botón "Anular"
    const anularButtons = screen.getAllByRole('button', { name: /anular/i });
    expect(anularButtons.length).toBe(1);

    // Venta anulada debe tener badge ANULADA y no botón
    expect(screen.getByText('ANULADA')).toBeDefined();
  });

  it('NO debe mostrar el botón de anular venta cuando el usuario es VENDEDOR (no admin)', () => {
    render(
      <CajaMovimientosTurno
        sessionData={mockSessionData}
        isAdmin={false}
        isCajaAbierta={true}
        categoriasGasto={mockCategorias}
      />
    );

    expect(screen.queryByRole('button', { name: /anular/i })).toBeNull();
  });

  it('debe mostrar botones de editar y eliminar egresos menores solo para ADMIN con caja abierta', () => {
    const { rerender } = render(
      <CajaMovimientosTurno
        sessionData={mockSessionData}
        isAdmin={true}
        isCajaAbierta={true}
        categoriasGasto={mockCategorias}
      />
    );

    expect(screen.getByRole('button', { name: /editar egreso/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /eliminar egreso/i })).toBeDefined();

    // Cuando no es admin, no debe mostrarlos
    rerender(
      <CajaMovimientosTurno
        sessionData={mockSessionData}
        isAdmin={false}
        isCajaAbierta={true}
        categoriasGasto={mockCategorias}
      />
    );

    expect(screen.queryByRole('button', { name: /editar egreso/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /eliminar egreso/i })).toBeNull();
  });

  it('debe abrir el modal de anulación al hacer clic en Anular', () => {
    render(
      <CajaMovimientosTurno
        sessionData={mockSessionData}
        isAdmin={true}
        isCajaAbierta={true}
        categoriasGasto={mockCategorias}
      />
    );

    const anularBtn = screen.getByRole('button', { name: /anular/i });
    fireEvent.click(anularBtn);

    // Debe mostrar el modal con el título y textarea
    expect(screen.getByText(/Anular Venta #TK-000101/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Cobro duplicado por error/i)).toBeDefined();
  });

  it('debe abrir el modal de edición de gasto al hacer clic en Editar', () => {
    render(
      <CajaMovimientosTurno
        sessionData={mockSessionData}
        isAdmin={true}
        isCajaAbierta={true}
        categoriasGasto={mockCategorias}
      />
    );

    const editBtn = screen.getByRole('button', { name: /editar egreso/i });
    fireEvent.click(editBtn);

    expect(screen.getByText(/Editar Egreso Menor #201/i)).toBeDefined();
    expect(screen.getByDisplayValue('Compra de bolsas térmicas')).toBeDefined();
  });

  it('debe abrir el modal de eliminación de gasto al hacer clic en Eliminar', () => {
    render(
      <CajaMovimientosTurno
        sessionData={mockSessionData}
        isAdmin={true}
        isCajaAbierta={true}
        categoriasGasto={mockCategorias}
      />
    );

    const delBtn = screen.getByRole('button', { name: /eliminar egreso/i });
    fireEvent.click(delBtn);

    expect(screen.getByText(/Eliminar Egreso Menor #201/i)).toBeDefined();
    expect(screen.getByText(/reintegrará automáticamente al saldo disponible/i)).toBeDefined();
  });
});
