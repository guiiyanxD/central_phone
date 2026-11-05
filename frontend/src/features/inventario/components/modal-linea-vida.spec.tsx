import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ModalLineaVida } from './modal-linea-vida';
import { api } from '@/lib/api';

// Mock del contexto de autenticación
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 1, nombre: 'Admin User', rol: 'ADMIN', sucursalId: 1 },
    isAuthenticated: true,
  }),
}));

// Mock del cliente API
vi.mock('@/lib/api', () => ({
  api: {
    modelos: {
      getLineaVida: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

const createMockLifeline = (overrides: any = {}) => ({
  dispositivo: {
    id: 1,
    imei1: '356987112233445',
    imei2: null,
    numeroSerie: 'F2LXYZ9988',
    condicion: 'NUEVO',
    porcentajeBateria: 100,
    estadoInventario: 'VENDIDO',
    precioVentaSugeridoBs: 7500,
    costoBs: 6000,
    costoUsd: 860,
    totalGastosActivosBs: 0,
    inversionTotalBs: 6000,
    gastos: [],
    modelo: 'iPhone 15 Pro',
    marca: 'Apple',
    color: 'Titanio Natural',
    capacidadGb: 256,
    tipoSim: 'SIM Físico',
    sucursalActual: { id: 1, nombre: 'Sucursal Central', ciudad: 'Santa Cruz' },
    ...overrides.dispositivo,
  },
  origen: {
    notaIngresoId: 10,
    proveedor: 'Mayorista USA',
    proveedorTelefono: '70011223',
    fechaIngreso: '2026-10-01T10:00:00Z',
    numeroComprobante: 'FAC-001',
    sucursalIngreso: 'Sucursal Central',
    usuarioReceptor: 'Admin',
    costoUnitarioBs: 6000,
    ...overrides.origen,
  },
  venta: overrides.venta !== undefined ? overrides.venta : {
    id: 50,
    ticketReferencia: 'TK-100-XYZ',
    fechaVenta: '2026-10-20T14:30:00Z',
    estadoVenta: 'COMPLETADA',
    vendedor: 'Vendedor Pos',
    cliente: {
      id: 5,
      nombre: 'Carlos Mesa',
      telefono: '77334455',
      ciNit: '8877665 SC',
    },
    metodoPago: 'Efectivo',
    precioVentaCobradoBs: 7500,
    costoUnitarioBs: 6000,
    gananciaBs: 1500,
    sucursalVenta: 'Sucursal Central',
  },
  garantia: {
    estadoInventario: 'VENDIDO',
    periodoMeses: 3,
    diasTotalesGarantia: 90,
    fechaVenta: '2026-10-20T14:30:00Z',
    fechaVencimientoGarantia: '2027-01-18T14:30:00Z',
    diasDesdeVenta: 15,
    diasRestantesGarantia: 75,
    diasVencida: 0,
    garantiaVigente: true,
    ...overrides.garantia,
  },
});

describe('ModalLineaVida - Etapa 4: Cobertura de Garantía', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar la garantía VIGENTE con días restantes y fecha de vencimiento para equipos vendidos', async () => {
    const mockLifelineData = createMockLifeline();

    (api.modelos.getLineaVida as any).mockResolvedValue(mockLifelineData);

    render(<ModalLineaVida isOpen={true} onClose={vi.fn()} imei="356987112233445" />);

    await waitFor(() => {
      expect(screen.getByText(/4\. Cobertura de Garantía/i)).toBeInTheDocument();
    });

    expect(screen.getByText('VIGENTE')).toBeInTheDocument();
    expect(screen.getByText(/Quedan 75 días/i)).toBeInTheDocument();
    expect(screen.getByText(/3 Meses \(90 días\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/75 días/i).length).toBeGreaterThanOrEqual(1);
  });

  it('debe alertar con badge POR VENCER cuando quedan 15 días o menos de garantía', async () => {
    const mockLifelineData = createMockLifeline({
      garantia: {
        diasDesdeVenta: 82,
        diasRestantesGarantia: 8,
        garantiaVigente: true,
      },
    });

    (api.modelos.getLineaVida as any).mockResolvedValue(mockLifelineData);

    render(<ModalLineaVida isOpen={true} onClose={vi.fn()} imei="356987112233446" />);

    await waitFor(() => {
      expect(screen.getByText('POR VENCER')).toBeInTheDocument();
    });
    expect(screen.getByText(/Quedan 8 días/i)).toBeInTheDocument();
  });

  it('debe mostrar estado VENCIDA con días expirados cuando se supera el período de 90 días', async () => {
    const mockLifelineData = createMockLifeline({
      garantia: {
        diasDesdeVenta: 110,
        diasRestantesGarantia: 0,
        diasVencida: 20,
        garantiaVigente: false,
      },
    });

    (api.modelos.getLineaVida as any).mockResolvedValue(mockLifelineData);

    render(<ModalLineaVida isOpen={true} onClose={vi.fn()} imei="356987112233447" />);

    await waitFor(() => {
      expect(screen.getByText('VENCIDA')).toBeInTheDocument();
    });
    expect(screen.getByText(/Expiró hace 20 días/i)).toBeInTheDocument();
  });

  it('debe indicar Pendiente de Venta para dispositivos disponibles en tienda', async () => {
    const mockLifelineData = createMockLifeline({
      dispositivo: {
        estadoInventario: 'DISPONIBLE',
      },
      venta: null,
      garantia: {
        estadoInventario: 'DISPONIBLE',
        fechaVenta: null,
        fechaVencimientoGarantia: null,
        diasDesdeVenta: null,
        diasRestantesGarantia: null,
        diasVencida: 0,
        garantiaVigente: null,
      },
    });

    (api.modelos.getLineaVida as any).mockResolvedValue(mockLifelineData);

    render(<ModalLineaVida isOpen={true} onClose={vi.fn()} imei="356987112233448" />);

    await waitFor(() => {
      expect(screen.getByText(/Pendiente de Venta \(Garantía no iniciada\)/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/No vendido/i)).toBeInTheDocument();
  });
});
