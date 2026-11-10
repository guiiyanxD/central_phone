import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalDetalleLoteAccesorio } from './modal-detalle-lote-accesorio';

describe('ModalDetalleLoteAccesorio Component', () => {
  const mockLote = {
    id: 15,
    accesorioId: 3,
    sucursalId: 1,
    nombreDiferenciador: 'MagSafe Silicone Case Negro',
    costoUnitarioBs: 100,
    precioVentaBs: 180,
    cantidadInicial: 20,
    stockActual: 14,
    fechaIngreso: '2026-10-15T10:00:00.000Z',
    accesorio: {
      id: 3,
      nombre: 'Funda Apple Original',
      descripcion: 'Silicona con imanes MagSafe integrados',
      categoria: { id: 1, nombre: 'Fundas y Carcasas' },
    },
    sucursal: {
      id: 1,
      nombre: 'Sucursal Central Equipetrol',
      ciudad: 'Santa Cruz, Bolivia',
    },
    notaIngreso: {
      id: 8,
      fechaIngreso: '2026-10-15T10:00:00.000Z',
      numeroComprobante: 'FAC-2026-08',
      proveedor: { id: 2, nombre: 'Importadora Miami Apple' },
    },
  };

  it('no debe renderizar nada si isOpen es false o lote es null', () => {
    const { container: c1 } = render(
      <ModalDetalleLoteAccesorio isOpen={false} onClose={vi.fn()} lote={mockLote} isAdmin={true} />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <ModalDetalleLoteAccesorio isOpen={true} onClose={vi.fn()} lote={null} isAdmin={true} />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('debe renderizar la cabecera, nombre del accesorio, stock y rotación', () => {
    render(
      <ModalDetalleLoteAccesorio isOpen={true} onClose={vi.fn()} lote={mockLote} isAdmin={false} />
    );

    expect(screen.getByText('Detalle Completo de Lote de Accesorio')).toBeDefined();
    expect(screen.getByText('Funda Apple Original')).toBeDefined();
    expect(screen.getByText('Fundas y Carcasas')).toBeDefined();
    expect(screen.getByText('MagSafe Silicone Case Negro')).toBeDefined();
    expect(screen.getByText('14 unidades disponibles')).toBeDefined();
    expect(screen.getByText('14 u.')).toBeDefined();
    expect(screen.getByText('20 u.')).toBeDefined();
    expect(screen.getByText('6 u.')).toBeDefined(); // 20 - 14 vendidas
  });

  it('debe proteger los costos y márgenes de adquisición cuando isAdmin es false', () => {
    render(
      <ModalDetalleLoteAccesorio
        isOpen={true}
        onClose={vi.fn()}
        lote={mockLote}
        isAdmin={false}
        tipoCambio={10}
      />
    );

    // Debe mostrar los precios sugeridos
    expect(screen.getByText(/Bs 180\.00/i)).toBeDefined();
    expect(screen.getByText(/\$ 18\.00/i)).toBeDefined(); // 180 / 10

    // NO debe mostrar costos ni márgenes
    expect(screen.queryByText(/Costo Adquisición/i)).toBeNull();
    expect(screen.queryByText(/Margen Bruto/i)).toBeNull();
  });

  it('debe calcular y mostrar costos y márgenes en Bs y USD cuando isAdmin es true', () => {
    render(
      <ModalDetalleLoteAccesorio
        isOpen={true}
        onClose={vi.fn()}
        lote={mockLote}
        isAdmin={true}
        tipoCambio={10}
      />
    );

    // Costos en Bs y USD (100 Bs / 10 TC = 10 USD)
    expect(screen.getByText(/Bs 100\.00/i)).toBeDefined();
    expect(screen.getByText(/\$ 10\.00/i)).toBeDefined();

    // Márgenes en Bs y USD (80 Bs / 10 TC = 8 USD)
    expect(screen.getByText(/\+Bs 80\.00/i)).toBeDefined();
    expect(screen.getByText(/\+\$ 8\.00/i)).toBeDefined();
  });

  it('debe mostrar los datos de sucursal física y procedencia del proveedor', () => {
    render(
      <ModalDetalleLoteAccesorio isOpen={true} onClose={vi.fn()} lote={mockLote} isAdmin={true} />
    );

    expect(screen.getByText('Sucursal Central Equipetrol')).toBeDefined();
    expect(screen.getByText('Importadora Miami Apple')).toBeDefined();
    expect(screen.getByText('FAC-2026-08')).toBeDefined();
  });
});
