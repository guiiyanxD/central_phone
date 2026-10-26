import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecepcionTelefonosTable } from './recepcion-telefonos-table';
import { TelefonoRow } from '../types';

describe('RecepcionTelefonosTable - Barcode Scanner & Shift Ergonomics', () => {
  const mockModelos = [
    {
      id: 1,
      nombreModelo: 'iPhone 15',
      tipo: 'IPHONE',
      variantes: [
        { id: 101, color: 'Negro', capacidadGb: 128, tipoSim: 'NANO_SIM_ESIM' },
      ],
    },
    {
      id: 2,
      nombreModelo: 'MacBook Air M2',
      tipo: 'MAC',
      variantes: [
        { id: 201, color: 'Space Gray', capacidadGb: 256, tipoSim: 'NO_APLICA' },
      ],
    },
  ];

  const defaultRow: TelefonoRow = {
    id: 'tel-1',
    varianteId: 101,
    modeloNombreDisplay: 'iPhone 15',
    modeloTipo: 'IPHONE',
    varianteDisplay: 'Negro • 128GB • NANO_SIM_ESIM',
    condicion: 'NUEVO',
    costoBs: 5000,
    costoUsd: 700,
    precioVentaSugeridoBs: 5750,
    numeroSerie: 'F2LZ998X',
    imei1: '354928112233445',
    imei2: '',
  };

  let mockOnAddTelefono: ReturnType<typeof vi.fn>;
  let mockOnAddSiguienteEquipo: ReturnType<typeof vi.fn>;
  let mockOnRemoveTelefono: ReturnType<typeof vi.fn>;
  let mockOnUpdateTelefono: ReturnType<typeof vi.fn>;
  let mockOnOpenInlineVarianteModal: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnAddTelefono = vi.fn();
    mockOnAddSiguienteEquipo = vi.fn();
    mockOnRemoveTelefono = vi.fn();
    mockOnUpdateTelefono = vi.fn();
    mockOnOpenInlineVarianteModal = vi.fn();
  });

  it('salta el foco de Número de Serie a IMEI 1 al presionar Enter (lector de barras)', () => {
    render(
      <RecepcionTelefonosTable
        telefonos={[defaultRow]}
        modelos={mockModelos}
        onAddTelefono={mockOnAddTelefono}
        onAddSiguienteEquipo={mockOnAddSiguienteEquipo}
        onRemoveTelefono={mockOnRemoveTelefono}
        onUpdateTelefono={mockOnUpdateTelefono}
        onOpenInlineVarianteModal={mockOnOpenInlineVarianteModal}
      />
    );

    const serieInput = screen.getByPlaceholderText('Ej: F2LZ998X...');
    const imei1Input = screen.getByPlaceholderText('35492811...');

    const focusSpy = vi.spyOn(imei1Input, 'focus');

    fireEvent.keyDown(serieInput, { key: 'Enter', code: 'Enter' });

    expect(focusSpy).toHaveBeenCalled();
  });

  it('salta el foco de IMEI 1 a IMEI 2 al presionar Enter (lector de barras)', () => {
    render(
      <RecepcionTelefonosTable
        telefonos={[defaultRow]}
        modelos={mockModelos}
        onAddTelefono={mockOnAddTelefono}
        onAddSiguienteEquipo={mockOnAddSiguienteEquipo}
        onRemoveTelefono={mockOnRemoveTelefono}
        onUpdateTelefono={mockOnUpdateTelefono}
        onOpenInlineVarianteModal={mockOnOpenInlineVarianteModal}
      />
    );

    const imei1Input = screen.getByPlaceholderText('35492811...');
    const imei2Input = screen.getByPlaceholderText('Opcional...');

    const focusSpy = vi.spyOn(imei2Input, 'focus');

    fireEvent.keyDown(imei1Input, { key: 'Enter', code: 'Enter' });

    expect(focusSpy).toHaveBeenCalled();
  });

  it('en IMEI 2, presionar Enter NO debe crear una nueva fila ni enviar el formulario', () => {
    render(
      <RecepcionTelefonosTable
        telefonos={[defaultRow]}
        modelos={mockModelos}
        onAddTelefono={mockOnAddTelefono}
        onAddSiguienteEquipo={mockOnAddSiguienteEquipo}
        onRemoveTelefono={mockOnRemoveTelefono}
        onUpdateTelefono={mockOnUpdateTelefono}
        onOpenInlineVarianteModal={mockOnOpenInlineVarianteModal}
      />
    );

    const imei2Input = screen.getByPlaceholderText('Opcional...');

    fireEvent.keyDown(imei2Input, { key: 'Enter', code: 'Enter' });

    expect(mockOnAddSiguienteEquipo).not.toHaveBeenCalled();
    expect(mockOnAddTelefono).not.toHaveBeenCalled();
  });

  it('crea el siguiente equipo al pulsar limpiamente la tecla Shift física', () => {
    render(
      <RecepcionTelefonosTable
        telefonos={[defaultRow]}
        modelos={mockModelos}
        onAddTelefono={mockOnAddTelefono}
        onAddSiguienteEquipo={mockOnAddSiguienteEquipo}
        onRemoveTelefono={mockOnRemoveTelefono}
        onUpdateTelefono={mockOnUpdateTelefono}
        onOpenInlineVarianteModal={mockOnOpenInlineVarianteModal}
      />
    );

    const serieInput = screen.getByPlaceholderText('Ej: F2LZ998X...');

    // Pulsación limpia de Shift: keydown Shift -> keyup Shift
    fireEvent.keyDown(serieInput, { key: 'Shift', code: 'ShiftLeft' });
    fireEvent.keyUp(serieInput, { key: 'Shift', code: 'ShiftLeft' });

    expect(mockOnAddSiguienteEquipo).toHaveBeenCalledWith('tel-1');
  });

  it('NO crea fila si Shift fue usado como modificador para escribir mayúsculas (ej. Shift + F)', () => {
    render(
      <RecepcionTelefonosTable
        telefonos={[defaultRow]}
        modelos={mockModelos}
        onAddTelefono={mockOnAddTelefono}
        onAddSiguienteEquipo={mockOnAddSiguienteEquipo}
        onRemoveTelefono={mockOnRemoveTelefono}
        onUpdateTelefono={mockOnUpdateTelefono}
        onOpenInlineVarianteModal={mockOnOpenInlineVarianteModal}
      />
    );

    const serieInput = screen.getByPlaceholderText('Ej: F2LZ998X...');

    // Simulamos escribir una 'F' con Shift presionado
    fireEvent.keyDown(serieInput, { key: 'Shift', code: 'ShiftLeft' });
    fireEvent.keyDown(serieInput, { key: 'F', code: 'KeyF', shiftKey: true });
    fireEvent.keyUp(serieInput, { key: 'Shift', code: 'ShiftLeft' });

    expect(mockOnAddSiguienteEquipo).not.toHaveBeenCalled();
  });

  it('NO crea fila con Shift si el número de serie de la fila actual está vacío', () => {
    const emptyRow: TelefonoRow = {
      ...defaultRow,
      numeroSerie: '',
    };

    render(
      <RecepcionTelefonosTable
        telefonos={[emptyRow]}
        modelos={mockModelos}
        onAddTelefono={mockOnAddTelefono}
        onAddSiguienteEquipo={mockOnAddSiguienteEquipo}
        onRemoveTelefono={mockOnRemoveTelefono}
        onUpdateTelefono={mockOnUpdateTelefono}
        onOpenInlineVarianteModal={mockOnOpenInlineVarianteModal}
      />
    );

    const serieInput = screen.getByPlaceholderText('Ej: F2LZ998X...');

    fireEvent.keyDown(serieInput, { key: 'Shift', code: 'ShiftLeft' });
    fireEvent.keyUp(serieInput, { key: 'Shift', code: 'ShiftLeft' });

    expect(mockOnAddSiguienteEquipo).not.toHaveBeenCalled();
  });
});
