import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalConfirmacionIngreso } from './modal-confirmacion-ingreso';

describe('ModalConfirmacionIngreso Component', () => {
  const baseNota = {
    id: 101,
    proveedor: { id: 1, nombre: 'Mega Distribuidora Apple' },
    sucursal: { id: 2, nombre: 'Sucursal Central Equipetrol' },
    totalCostoBs: 14500.5,
  };

  it('debe renderizar el costo en USD formateado cuando existen dispositivos con costo en dólares', () => {
    const notaConTelefonos = {
      ...baseNota,
      dispositivos: [
        { id: 1, costoBs: 7000, costoUsd: 1000 },
        { id: 2, costoBs: 1750, costoUsd: 250 },
      ],
      lotesAccesorio: [],
    };

    render(
      <ModalConfirmacionIngreso
        notaCreada={notaConTelefonos}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText('Costo Total USD:')).toBeInTheDocument();
    // 1000 + 250 = 1250 => "$ 1.250,00 USD" en es-BO
    expect(screen.getByText(/\$ 1[.,]250[.,]00 USD/i)).toBeInTheDocument();
    expect(screen.getByText('2 unidades')).toBeInTheDocument();
  });

  it('debe mostrar un guion medio (-) cuando solo se reciben accesorios y no aplica costo en USD', () => {
    const notaSoloAccesorios = {
      ...baseNota,
      dispositivos: [],
      lotesAccesorio: [
        { id: 1, nombreDiferenciador: 'Fundas Silicona', costoUnitarioBs: 50, cantidadInicial: 20 },
        { id: 2, nombreDiferenciador: 'Cargadores 20W', costoUnitarioBs: 120, cantidadInicial: 10 },
      ],
    };

    render(
      <ModalConfirmacionIngreso
        notaCreada={notaSoloAccesorios}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText('Costo Total USD:')).toBeInTheDocument();
    // Debe mostrar un guion medio "-"
    const usdValue = screen.getByText('Costo Total USD:').nextElementSibling;
    expect(usdValue).toHaveTextContent('-');
    expect(screen.getByText('2 lotes')).toBeInTheDocument();
    expect(screen.getByText('0 unidades')).toBeInTheDocument();
  });

  it('debe mostrar un guion medio (-) si los dispositivos tienen costo USD en 0', () => {
    const notaConCostoCero = {
      ...baseNota,
      dispositivos: [
        { id: 1, costoBs: 3000, costoUsd: 0 },
      ],
      lotesAccesorio: [],
    };

    render(
      <ModalConfirmacionIngreso
        notaCreada={notaConCostoCero}
        onReset={vi.fn()}
      />
    );

    const usdValue = screen.getByText('Costo Total USD:').nextElementSibling;
    expect(usdValue).toHaveTextContent('-');
  });

  it('debe permitir interactuar con los botones de acción', () => {
    const onResetMock = vi.fn();
    const onGoToHistorialMock = vi.fn();

    render(
      <ModalConfirmacionIngreso
        notaCreada={baseNota}
        onReset={onResetMock}
        onGoToHistorial={onGoToHistorialMock}
        isAdmin={true}
      />
    );

    const btnReset = screen.getByRole('button', { name: /Registrar Otra Nota/i });
    fireEvent.click(btnReset);
    expect(onResetMock).toHaveBeenCalledTimes(1);

    const btnHistorial = screen.getByRole('button', { name: /Ver en Historial/i });
    fireEvent.click(btnHistorial);
    expect(onGoToHistorialMock).toHaveBeenCalledTimes(1);
  });
});
