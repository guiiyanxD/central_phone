import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalAuditoriaRecepcion } from './modal-auditoria-recepcion';
import { api } from '@/lib/api';

let mockUserRole = 'ADMIN';

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 1, nombre: 'Test User', rol: mockUserRole, sucursalId: 1 },
    isAuthenticated: true,
  }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    modelos: {
      addGastoDispositivo: vi.fn(),
      updateDispositivo: vi.fn(),
      getLineaVida: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('ModalAuditoriaRecepcion Component', () => {
  const mockRecepcionData = {
    id: 45,
    tipoIngreso: 'MAYORISTA',
    proveedor: { id: 10, nombre: 'Apple Wholesale LLC', telefono: '78912345' },
    sucursal: { id: 1, nombre: 'Sucursal Central' },
    fechaIngreso: '2026-11-10T12:00:00.000Z',
    usuario: { id: 1, nombre: 'Carlos Admin' },
    numeroComprobante: 'FAC-99881',
    resumenFinanciero: {
      inversionTotalBs: 8250,
      totalCostoBs: 8000,
      totalGastosBs: 250,
      totalCostoUsd: 1150,
      totalUnidadesIngresadas: 2,
      totalDispositivos: 2,
      totalAccesorios: 0,
      porcentajeVentaRealizada: 50,
      totalVentaRealizadaBs: 5200,
      totalVentaProyectadaBs: 9500,
      margenProyectadoBs: 1250,
      margenRealizadoBs: 700,
      totalUnidadesVendidas: 1,
      porcentajeUnidadesVendidas: 50,
      porcentajeMargenProyectado: 15.2,
    },
    dispositivos: [
      {
        id: 101,
        numeroSerie: 'SN-IP13-001',
        imei1: '351111111111111',
        imei2: '351111111111112',
        costoBs: 3500,
        costoUsd: 500,
        gastosInvertidosBs: 250,
        inversionTotalBs: 3750,
        precioVentaSugeridoBs: 4300,
        condicion: 'SEMINUEVO',
        estadoInventario: 'DISPONIBLE',
        porcentajeBateria: 88,
        detallesFisicos: 'Batería reemplazada original',
        variante: {
          color: 'Azul',
          capacidadGb: 128,
          tipoSim: 'FÍSICA + eSIM',
          modelo: { nombreModelo: 'iPhone 13', tipo: 'IPHONE' },
        },
        gastos: [{ id: 1, concepto: 'Batería', costoBs: 250, estado: 'ACTIVO' }],
      },
      {
        id: 102,
        numeroSerie: 'SN-IP14-002',
        imei1: '352222222222222',
        costoBs: 4500,
        costoUsd: 650,
        gastosInvertidosBs: 0,
        inversionTotalBs: 4500,
        precioVentaSugeridoBs: 5200,
        condicion: 'NUEVO',
        estadoInventario: 'VENDIDO',
        porcentajeBateria: 100,
        detalleVentas: [{ subtotalBs: 5200 }],
        variante: {
          color: 'Medianoche',
          capacidadGb: 256,
          tipoSim: 'DUAL SIM',
          modelo: { nombreModelo: 'iPhone 14', tipo: 'IPHONE' },
        },
      },
    ],
    lotesAccesorio: [],
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    recepcionDetalleData: mockRecepcionData,
    isLoadingRecDetalle: false,
    onRefreshDetalle: vi.fn(),
    onUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRole = 'ADMIN';
  });

  it('debe renderizar las tarjetas KPI financieras y la cabecera de la nota de ingreso', () => {
    render(<ModalAuditoriaRecepcion {...defaultProps} />);

    expect(screen.getByText(/Auditoría Financiera: Nota de Ingreso #ING-45/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Apple Wholesale LLC/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/FAC-99881/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Inversión Total/i)).toBeInTheDocument();
    expect(screen.getByText(/Progreso de Ventas/i)).toBeInTheDocument();
    expect(screen.getByText(/Margen y Ganancia/i)).toBeInTheDocument();
  });

  it('debe renderizar el botón Editar para ADMIN en dispositivos disponibles', () => {
    mockUserRole = 'ADMIN';
    render(<ModalAuditoriaRecepcion {...defaultProps} />);

    const editButtons = screen.getAllByRole('button', { name: /Editar información técnica/i });
    expect(editButtons.length).toBe(1); // Solo para el equipo disponible (SN-IP13-001)
  });

  it('NO debe renderizar el botón Editar en dispositivos que ya están VENDIDOS', () => {
    mockUserRole = 'ADMIN';
    render(<ModalAuditoriaRecepcion {...defaultProps} />);

    expect(screen.getByText('Vendido')).toBeInTheDocument();
    // Debe haber solo 1 botón de edición (para el disponible)
    const editButtons = screen.getAllByRole('button', { name: /Editar información técnica/i });
    expect(editButtons.length).toBe(1);
  });

  it('NO debe renderizar el botón Editar si el usuario tiene rol VENDEDOR', () => {
    mockUserRole = 'VENDEDOR';
    render(<ModalAuditoriaRecepcion {...defaultProps} />);

    const editButtons = screen.queryAllByRole('button', { name: /Editar información técnica/i });
    expect(editButtons.length).toBe(0);
  });

  it('debe abrir el modal de registrar gasto al hacer clic en + Gasto', () => {
    render(<ModalAuditoriaRecepcion {...defaultProps} />);

    const gastoButton = screen.getByRole('button', { name: /Registrar gasto técnico para el equipo SN-IP13-001/i });
    fireEvent.click(gastoButton);

    expect(screen.getByText('Registrar Gasto Técnico')).toBeInTheDocument();
    expect(screen.getByLabelText(/Concepto del Gasto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Costo \(Bs\)/i)).toBeInTheDocument();
  });
});
