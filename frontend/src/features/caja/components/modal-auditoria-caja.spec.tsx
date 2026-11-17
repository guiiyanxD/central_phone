import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalAuditoriaCaja } from './modal-auditoria-caja';

describe('ModalAuditoriaCaja Component', () => {
  const mockCajaDetalleConPermutas = {
    caja: {
      id: 13,
      fechaApertura: '2026-11-17T00:18:47.974Z',
      fechaCierre: '2026-11-17T14:44:02.281Z',
      estado: 'CERRADA',
      montoInicialEfectivo: 10,
      montoFinalEfectivo: 13210,
      montoTeoricoEfectivo: 13210,
      diferenciaEfectivo: 0,
      sucursal: { id: 1, nombre: 'Central 1', ciudad: 'La Paz' },
      usuarioApertura: { id: 1, nombre: 'Admin Central' },
      ventas: [
        {
          id: 55,
          fechaHora: '2026-11-17T00:30:47.412Z',
          totalVentaBs: 15500,
          montoPermutaBs: 2500,
          montoEfectivoBs: 13000,
          montoDigitalBs: 0,
          estado: 'COMPLETADA',
          metodoPago: { id: 1, codigo: 'EFECTIVO', nombre: 'Efectivo en Caja' },
          cliente: { nombreCompleto: 'Cliente Prueba 1' },
          costoTotalBs: 13000,
          gananciaNetaBs: 2500,
          detalles: [
            {
              id: 1,
              cantidad: 1,
              costoUnitarioBs: 13000,
              precioUnitarioBs: 15500,
              subtotalBs: 15500,
              dispositivo: {
                id: 1,
                numeroSerie: 'SN55',
                variante: {
                  color: 'Orange',
                  modelo: { nombreModelo: 'iPhone 17 Pro' },
                },
              },
            },
          ],
        },
      ],
      gastosOperativos: [],
      gastosDispositivo: [],
    },
    resumenFinanciero: {
      montoInicialEfectivo: 10,
      totalVentasEfectivo: 13200,
      totalVentasDigitales: 203280,
      totalVentasCobrado: 216480,
      totalVentasTotal: 242980,
      totalGastosEfectivo: 0,
      totalGastosOtros: 0,
      totalGastosTotal: 0,
      totalPermutasBs: 26500,
      saldoTeoricoEfectivo: 13210,
      montoFinalEfectivo: 13210,
      diferenciaEfectivo: 0,
      cantidadVentas: 1,
      cantidadVentasCompletadas: 1,
      cantidadVentasAnuladas: 0,
      cantidadGastos: 0,
      totalCostoMercaderia: 223667,
      gananciaNetaVentas: 19313,
      gananciaNetaOperativa: 19313,
    },
  };

  it('debe renderizar el desglose de ventas totales incluyendo permutas para ADMIN', () => {
    render(
      <ModalAuditoriaCaja
        isOpen={true}
        onClose={vi.fn()}
        cajaDetalleData={mockCajaDetalleConPermutas}
        isLoadingDetalle={false}
        isAdmin={true}
      />
    );

    // Ventas Totales facturadas
    expect(screen.getByText('Bs 242980.00')).toBeInTheDocument();
    // Subtítulo con desglose de Efectivo, QR y Permutas
    expect(
      screen.getByText(/Efec: Bs 13200.00 • QR: Bs 203280.00 • Permutas: Bs 26500.00/)
    ).toBeInTheDocument();

    // Ganancia Neta comercial real
    expect(screen.getByText('+Bs 19313.00')).toBeInTheDocument();
    expect(
      screen.getByText(/CMV: Bs 223667.00 • Neta op: \+Bs 19313.00/)
    ).toBeInTheDocument();
  });

  it('debe ocultar ganancia neta y mostrar saldo teórico cuando el rol es VENDEDOR', () => {
    render(
      <ModalAuditoriaCaja
        isOpen={true}
        onClose={vi.fn()}
        cajaDetalleData={mockCajaDetalleConPermutas}
        isLoadingDetalle={false}
        isAdmin={false}
      />
    );

    // Saldo Teórico en gaveta
    expect(screen.getByText('Saldo Teórico')).toBeInTheDocument();
    // Aparece tanto en el arqueo como en el saldo teórico
    expect(screen.getAllByText('Bs 13210.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Saldo calculado en gaveta')).toBeInTheDocument();
    expect(screen.queryByText('+Bs 19313.00')).not.toBeInTheDocument();
  });

  it('debe dar formato adecuado a ganancia neta negativa sin duplicar signo (+Bs -...)', () => {
    const mockCajaConPerdida = {
      ...mockCajaDetalleConPermutas,
      resumenFinanciero: {
        ...mockCajaDetalleConPermutas.resumenFinanciero,
        gananciaNetaVentas: -500,
        gananciaNetaOperativa: -550,
      },
    };

    render(
      <ModalAuditoriaCaja
        isOpen={true}
        onClose={vi.fn()}
        cajaDetalleData={mockCajaConPerdida}
        isLoadingDetalle={false}
        isAdmin={true}
      />
    );

    expect(screen.getByText('-Bs 500.00')).toBeInTheDocument();
    expect(screen.getByText(/Neta op: -Bs 550.00/)).toBeInTheDocument();
  });
});
