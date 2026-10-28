import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecepcionTelefonosTable } from './recepcion-telefonos-table';
import { RecepcionAccesoriosTable } from './recepcion-accesorios-table';
import { RecepcionResumenPanel } from './recepcion-resumen-panel';

describe('Contenedores con Scroll Independiente y Barra Flotante', () => {
  it('RecepcionTelefonosTable debe incluir cabecera sticky, badge contador y contenedor max-h-[520px]', () => {
    const mockTelefonos: any[] = [
      {
        id: 't-1',
        varianteId: 1,
        numeroSerie: 'SN001',
        imei1: '123456789012345',
        imei2: '',
        condicion: 'NUEVO',
        costoBs: 1000,
        costoUsd: 140,
        precioVentaSugeridoBs: 1150,
      },
      {
        id: 't-2',
        varianteId: 1,
        numeroSerie: 'SN002',
        imei1: '123456789012346',
        imei2: '',
        condicion: 'NUEVO',
        costoBs: 1000,
        costoUsd: 140,
        precioVentaSugeridoBs: 1150,
      },
    ];

    const { container } = render(
      <RecepcionTelefonosTable
        telefonos={mockTelefonos}
        modelos={[]}
        onAddTelefono={vi.fn()}
        onRemoveTelefono={vi.fn()}
        onUpdateTelefono={vi.fn()}
        onOpenInlineVarianteModal={vi.fn()}
      />
    );

    // Badge contador
    expect(screen.getByText('2 equipos')).toBeDefined();

    // Numeración LIFO: la fila superior (index 0) es Unidad #2, la siguiente es Unidad #1
    expect(screen.getByText('Unidad #2')).toBeDefined();
    expect(screen.getByText('Unidad #1')).toBeDefined();

    // Cabecera sticky
    const header = container.querySelector('.sticky.top-0');
    expect(header).not.toBeNull();

    // Contenedor con scroll limitado
    const scrollContainer = container.querySelector('.max-h-\\[520px\\]');
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer?.className).toContain('overflow-y-auto');
  });

  it('RecepcionAccesoriosTable debe incluir cabecera sticky, badge contador y contenedor max-h-[520px]', () => {
    const mockAccesorios: any[] = [
      {
        id: 'a-2',
        accesorioId: 1,
        nombreDiferenciador: 'Lote MagSafe Azul',
        cantidad: 10,
        costoUnitarioBs: 50,
        precioVentaBs: 100,
      },
      {
        id: 'a-1',
        accesorioId: 1,
        nombreDiferenciador: 'Lote Silicona Simple',
        cantidad: 20,
        costoUnitarioBs: 20,
        precioVentaBs: 40,
      },
    ];

    const { container } = render(
      <RecepcionAccesoriosTable
        accesorios={mockAccesorios}
        accesoriosCatalogo={[]}
        onAddAccesorio={vi.fn()}
        onRemoveAccesorio={vi.fn()}
        onUpdateAccesorio={vi.fn()}
        onOpenInlineAccesorioModal={vi.fn()}
      />
    );

    // Badge contador
    expect(screen.getByText('2 lotes')).toBeDefined();

    // Numeración LIFO
    expect(screen.getByText('Lote #2')).toBeDefined();
    expect(screen.getByText('Lote #1')).toBeDefined();

    // Cabecera sticky
    const header = container.querySelector('.sticky.top-0');
    expect(header).not.toBeNull();

    // Contenedor con scroll limitado
    const scrollContainer = container.querySelector('.max-h-\\[520px\\]');
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer?.className).toContain('overflow-y-auto');
  });

  it('RecepcionResumenPanel debe fijarse en la parte inferior (sticky bottom) y proyectar totales financieros', () => {
    const { container } = render(
      <RecepcionResumenPanel
        totalUnidadesTelefonos={5}
        totalUnidadesAccesorios={20}
        totalCostoNotaBs={15500.5}
        isSubmitting={false}
      />
    );

    // Sticky bottom
    const panel = container.querySelector('.sticky.bottom-4');
    expect(panel).not.toBeNull();

    // Metricas
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('20')).toBeDefined();
    expect(screen.getByText(/15.500,50/)).toBeDefined();

    // Botón de submit
    expect(screen.getByRole('button', { name: /Registrar Nota de Ingreso/i })).toBeDefined();
  });
});
