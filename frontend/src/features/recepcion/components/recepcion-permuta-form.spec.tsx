import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecepcionPermutaForm } from './recepcion-permuta-form';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    configuracion: {
      getMargenes: vi.fn(),
    },
    recepcion: {
      createPermuta: vi.fn(),
    },
    proveedores: {
      getAll: vi.fn().mockResolvedValue([]),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('RecepcionPermutaForm Component', () => {
  const mockModelos = [
    {
      id: 1,
      nombreModelo: 'iPhone 13',
      tipo: 'IPHONE',
      variantes: [
        {
          id: 10,
          color: 'Negro',
          capacidadGb: 128,
          tipoSim: 'SIM Físico',
        },
        {
          id: 11,
          color: 'Azul',
          capacidadGb: 256,
          tipoSim: 'eSIM',
        },
      ],
    },
    {
      id: 2,
      nombreModelo: 'iPhone 15 Pro',
      tipo: 'IPHONE',
      variantes: [
        {
          id: 20,
          color: 'Titanio Natural',
          capacidadGb: 256,
          tipoSim: 'eSIM',
        },
      ],
    },
  ];

  const mockSucursales = [
    { id: 1, nombre: 'Sucursal Central', ciudad: 'Santa Cruz' },
  ];

  const defaultProps = {
    modelos: mockModelos,
    sucursales: mockSucursales,
    currentSucursalId: 1,
    isAdmin: true,
    onSuccess: vi.fn(),
    onOpenInlineVarianteModal: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.configuracion.getMargenes as any).mockResolvedValue([
      { categoria: 'PERMUTA', tipoAumento: 'PORCENTAJE', valorBs: 15 },
    ]);
    (api.recepcion.createPermuta as any).mockResolvedValue({ id: 101 });
  });

  it('debe renderizar la sección de especificaciones de dispositivos y el campo Registro con chips de auditoría', async () => {
    render(<RecepcionPermutaForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/2. Especificaciones de los Dispositivos Recibidos/i)).toBeDefined();
    });

    expect(screen.getByLabelText(/Registro/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Liberado de fábrica/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /\+ Libre Fábrica/i })).toBeDefined();
  });

  it('debe enviar el valor de "Registro" como detallesFisicos al registrar la permuta', async () => {
    render(<RecepcionPermutaForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Nombre \*/i), { target: { value: 'Mateo' } });
    fireEvent.change(screen.getByLabelText(/Teléfono de Contacto/i), { target: { value: '71234567' } });
    fireEvent.change(screen.getByLabelText(/Serie/i), { target: { value: 'F2LXYZ123' } });
    fireEvent.change(screen.getByLabelText(/IMEI 1/i), { target: { value: '354928110009999' } });
    fireEvent.change(screen.getByLabelText(/Registro/i), {
      target: { value: 'Liberado de fábrica (Comprobado con chip Entel)' },
    });
    fireEvent.change(screen.getByLabelText(/Costo de Toma/i), { target: { value: '2500' } });

    const submitBtn = screen.getByRole('button', { name: /Registrar Permuta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.recepcion.createPermuta).toHaveBeenCalledWith(
        expect.objectContaining({
          proveedorMinorista: expect.objectContaining({
            nombre: 'Mateo',
            telefono: '71234567',
          }),
          dispositivos: expect.arrayContaining([
            expect.objectContaining({
              detallesFisicos: 'Liberado de fábrica (Comprobado con chip Entel)',
              numeroSerie: 'F2LXYZ123',
              imei1: '354928110009999',
              costoBs: 2500,
            }),
          ]),
        }),
      );
    });

    expect(defaultProps.onSuccess).toHaveBeenCalledWith({ id: 101 });
  });

  it('debe permitir agregar múltiples dispositivos y enviar el lote consolidado', async () => {
    render(<RecepcionPermutaForm {...defaultProps} />);

    // Llenar datos del cliente
    fireEvent.change(screen.getByLabelText(/Nombre \*/i), { target: { value: 'Carlos' } });
    fireEvent.change(screen.getByLabelText(/Teléfono de Contacto/i), { target: { value: '78901234' } });

    // Llenar iPhone #1
    const serieInputs = screen.getAllByLabelText(/Serie/i);
    const imeiInputs = screen.getAllByLabelText(/IMEI 1/i);
    const costoInputs = screen.getAllByLabelText(/Costo de Toma/i);

    fireEvent.change(serieInputs[0], { target: { value: 'SN-IPH13-001' } });
    fireEvent.change(imeiInputs[0], { target: { value: '351111111111111' } });
    fireEvent.change(costoInputs[0], { target: { value: '3000' } });

    // Agregar segundo dispositivo
    const addBtn = screen.getByRole('button', { name: /\+ Agregar otro Dispositivo/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText(/Total Dispositivos/i)).toBeDefined();
    });

    // Llenar iPhone #2
    const serieInputsAfter = screen.getAllByLabelText(/Serie/i);
    const imeiInputsAfter = screen.getAllByLabelText(/IMEI 1/i);
    const costoInputsAfter = screen.getAllByLabelText(/Costo de Toma/i);

    expect(serieInputsAfter.length).toBe(2);
    fireEvent.change(serieInputsAfter[1], { target: { value: 'SN-IPH15-002' } });
    fireEvent.change(imeiInputsAfter[1], { target: { value: '352222222222222' } });
    fireEvent.change(costoInputsAfter[1], { target: { value: '5000' } });

    // Confirmar permuta multi-equipo
    const submitBtn = screen.getByRole('button', { name: /Registrar Permuta \(2 dispositivos\)/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.recepcion.createPermuta).toHaveBeenCalledWith(
        expect.objectContaining({
          dispositivos: [
            expect.objectContaining({
              imei1: '351111111111111',
              costoBs: 3000,
            }),
            expect.objectContaining({
              imei1: '352222222222222',
              costoBs: 5000,
            }),
          ],
        }),
      );
    });
  });

  it('debe duplicar las especificaciones de un dispositivo al pulsar "Duplicar"', async () => {
    render(<RecepcionPermutaForm {...defaultProps} />);

    // Llenar dispositivo #1 con costo 3500 y detalles
    const costoInput = screen.getByLabelText(/Costo de Toma/i);
    fireEvent.change(costoInput, { target: { value: '3500' } });

    const duplicateBtn = screen.getByRole('button', { name: /Duplicar/i });
    fireEvent.click(duplicateBtn);

    await waitFor(() => {
      const costoInputs = screen.getAllByLabelText(/Costo de Toma/i);
      expect(costoInputs.length).toBe(2);
      expect((costoInputs[1] as HTMLInputElement).value).toBe('3500');
    });
  });

  it('debe permitir recibir una MacBook en permuta con número de serie y sin IMEI', async () => {
    const modelosConMac = [
      ...mockModelos,
      {
        id: 3,
        nombreModelo: 'MacBook Pro 14 M3',
        tipo: 'MAC',
        variantes: [
          {
            id: 30,
            color: 'Space Black',
            capacidadGb: 512,
            tipoSim: 'N/A',
          },
        ],
      },
    ];

    render(<RecepcionPermutaForm {...defaultProps} modelos={modelosConMac} />);

    fireEvent.change(screen.getByLabelText(/Nombre \*/i), { target: { value: 'Laura' } });
    fireEvent.change(screen.getByLabelText(/Teléfono de Contacto/i), { target: { value: '70112233' } });

    // Cambiar a MacBook Pro
    const modeloSelect = screen.getByLabelText(/Modelo del Dispositivo/i);
    fireEvent.change(modeloSelect, { target: { value: '3' } });

    // Llenar N° de Serie y costo, dejando IMEI 1 vacío
    const serieInput = screen.getByLabelText(/N° de Serie \*/i);
    fireEvent.change(serieInput, { target: { value: 'C02G41ABQ05D' } });

    const costoInput = screen.getByLabelText(/Costo de Toma/i);
    fireEvent.change(costoInput, { target: { value: '7500' } });

    // Clic en chip de auditoría iCloud Libre
    const icloudChip = screen.getByRole('button', { name: /\+ iCloud Libre/i });
    fireEvent.click(icloudChip);

    const submitBtn = screen.getByRole('button', { name: /Registrar Permuta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.recepcion.createPermuta).toHaveBeenCalledWith(
        expect.objectContaining({
          proveedorMinorista: expect.objectContaining({
            nombre: 'Laura',
          }),
          dispositivos: expect.arrayContaining([
            expect.objectContaining({
              varianteId: 30,
              numeroSerie: 'C02G41ABQ05D',
              imei1: undefined,
              costoBs: 7500,
              detallesFisicos: 'iCloud Libre',
            }),
          ]),
        }),
      );
    });
  });
});
