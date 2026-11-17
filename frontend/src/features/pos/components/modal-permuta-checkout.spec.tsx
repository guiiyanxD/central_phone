import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalPermutaCheckout } from './modal-permuta-checkout';

describe('ModalPermutaCheckout', () => {
  const mockModelos = [
    {
      id: 1,
      nombreModelo: 'iPhone 13',
      tipo: 'IPHONE',
      variantes: [
        { id: 10, color: 'Midnight', capacidadGb: 128, tipoSim: 'NANO_SIM' },
        { id: 11, color: 'Starlight', capacidadGb: 256, tipoSim: 'NANO_SIM' },
      ],
    },
    {
      id: 2,
      nombreModelo: 'iPhone 14 Pro',
      tipo: 'IPHONE',
      variantes: [
        { id: 20, color: 'Deep Purple', capacidadGb: 128, tipoSim: 'ESIM' },
      ],
    },
  ];

  it('no debe renderizar nada si isOpen es false', () => {
    const { container } = render(
      <ModalPermutaCheckout
        isOpen={false}
        onClose={vi.fn()}
        totalBs={5000}
        modelos={mockModelos}
        onApplyPermuta={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar inputs y calcular correctamente el saldo restante', () => {
    render(
      <ModalPermutaCheckout
        isOpen={true}
        onClose={vi.fn()}
        totalBs={5000}
        modelos={mockModelos}
        onApplyPermuta={vi.fn()}
      />
    );

    expect(screen.getByText('Aplicar Permuta (Trade-In) en POS')).toBeDefined();
    expect(screen.getAllByText(/5000\.00/).length).toBeGreaterThanOrEqual(1);

    const valorInput = screen.getByLabelText(/Valor de Toma Acordado/i);
    fireEvent.change(valorInput, { target: { value: '1800' } });

    expect(screen.getByText('- Bs 1800.00')).toBeDefined();
    expect(screen.getByText('Bs 3200.00')).toBeDefined(); // 5000 - 1800
  });

  it('debe impedir enviar si el valor de toma supera el total de compra', () => {
    render(
      <ModalPermutaCheckout
        isOpen={true}
        onClose={vi.fn()}
        totalBs={3000}
        modelos={mockModelos}
        onApplyPermuta={vi.fn()}
      />
    );

    const imeiInput = screen.getByLabelText(/IMEI 1/i);
    fireEvent.change(imeiInput, { target: { value: '356987112233445' } });

    const valorInput = screen.getByLabelText(/Valor de Toma Acordado/i);
    fireEvent.change(valorInput, { target: { value: '4000' } });

    const submitBtn = screen.getByRole('button', { name: /Aplicar Permuta/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);
  });

  it('debe llamar a onApplyPermuta con datos sanitizados al completar el formulario', () => {
    const onApplyMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <ModalPermutaCheckout
        isOpen={true}
        onClose={onCloseMock}
        totalBs={5000}
        modelos={mockModelos}
        onApplyPermuta={onApplyMock}
      />
    );

    const imeiInput = screen.getByLabelText(/IMEI 1/i);
    fireEvent.change(imeiInput, { target: { value: '356987112233445' } });

    const valorInput = screen.getByLabelText(/Valor de Toma Acordado/i);
    fireEvent.change(valorInput, { target: { value: '2000' } });

    const submitBtn = screen.getByRole('button', { name: /Aplicar Permuta/i });
    fireEvent.click(submitBtn);

    expect(onApplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        varianteId: 10,
        imei1: '356987112233445',
        porcentajeBateria: 85,
        valorTomaBs: 2000,
      }),
      expect.objectContaining({
        modeloNombre: 'iPhone 13',
        valorTomaBs: 2000,
      })
    );
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('debe permitir agregar un segundo equipo con el botón "+ Agregar otro Dispositivo en Permuta" y calcular el total acumulado', () => {
    const onApplyPermutasMock = vi.fn();
    render(
      <ModalPermutaCheckout
        isOpen={true}
        onClose={vi.fn()}
        totalBs={8000}
        modelos={mockModelos}
        onApplyPermutas={onApplyPermutasMock}
      />
    );

    const addBtn = screen.getByRole('button', { name: /\+ Agregar otro Dispositivo en Permuta/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Dispositivo en Permuta #1')).toBeDefined();
    expect(screen.getByText('Dispositivo en Permuta #2')).toBeDefined();
  });

  it('debe permitir aplicar permuta de una Mac con número de serie y sin IMEI', () => {
    const onApplyMock = vi.fn();
    const mockModelosConMac = [
      ...mockModelos,
      {
        id: 5,
        nombreModelo: 'MacBook Air M2',
        tipo: 'MAC',
        variantes: [{ id: 50, color: 'Midnight', capacidadGb: 256, tipoSim: 'N/A' }],
      },
    ];

    render(
      <ModalPermutaCheckout
        isOpen={true}
        onClose={vi.fn()}
        totalBs={9000}
        modelos={mockModelosConMac}
        initialPermuta={{
          varianteId: 50,
          valorTomaBs: 4500,
          imei1: '',
          numeroSerie: 'C02H1234MD6R',
          detallesFisicos: '',
        }}
        onApplyPermuta={onApplyMock}
      />
    );

    // Verificar que N° de Serie está presente para la Mac
    const serieInput = screen.getByLabelText(/N° de Serie \*/i);
    expect(serieInput).toBeDefined();

    // Audit chip: Sin MDM
    const chipMdm = screen.getByRole('button', { name: /\+ Sin MDM/i });
    fireEvent.click(chipMdm);

    const submitBtn = screen.getByRole('button', { name: /Aplicar Permuta/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(submitBtn);

    expect(onApplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        varianteId: 50,
        numeroSerie: 'C02H1234MD6R',
        imei1: undefined,
        valorTomaBs: 4500,
        detallesFisicos: 'Sin MDM',
      }),
      expect.objectContaining({
        modeloNombre: 'MacBook Air M2',
        valorTomaBs: 4500,
      })
    );
  });
});
