import { TipoAumentoMargen } from '@prisma/client';
import {
  calcularPrecioSugeridoBs,
  calcularPrecioSugeridoUsd,
} from './pricing-calculator.util';

describe('PricingCalculatorUtil', () => {
  describe('calcularPrecioSugeridoBs', () => {
    it('debe aplicar fallback del 15% cuando la regla es nula o indefinida', () => {
      // 100 * 1.15 = 115
      expect(calcularPrecioSugeridoBs(100, null)).toBe(115);
      expect(calcularPrecioSugeridoBs(100, undefined)).toBe(115);
    });

    it('debe redondear al entero superior con Math.ceil en porcentaje', () => {
      // 100.5 * 1.15 = 115.575 -> 116
      expect(calcularPrecioSugeridoBs(100.5, null)).toBe(116);
      // 3694.05 * 1.15 = 4248.1575 -> 4249
      expect(
        calcularPrecioSugeridoBs(3694.05, {
          tipoAumento: TipoAumentoMargen.PORCENTAJE,
          valorBs: 15,
        }),
      ).toBe(4249);
    });

    it('debe aplicar aumento absoluto en Bolivianos', () => {
      expect(
        calcularPrecioSugeridoBs(100, {
          tipoAumento: TipoAumentoMargen.ABSOLUTO,
          valorBs: 30,
        }),
      ).toBe(130);

      // Con decimales en costo base
      // 100.2 + 30 = 130.2 -> 131
      expect(
        calcularPrecioSugeridoBs(100.2, {
          tipoAumento: TipoAumentoMargen.ABSOLUTO,
          valorBs: 30,
        }),
      ).toBe(131);
    });

    it('debe sumar los gastos de reparación al 100% sobre el precio sugerido', () => {
      // base: 100 con 20% = 120 + 50 de gastos = 170
      expect(
        calcularPrecioSugeridoBs(
          100,
          {
            tipoAumento: TipoAumentoMargen.PORCENTAJE,
            valorBs: 20,
          },
          50,
        ),
      ).toBe(170);

      // base: 100 con 50 Bs absoluto = 150 + 25 de gastos = 175
      expect(
        calcularPrecioSugeridoBs(
          100,
          {
            tipoAumento: TipoAumentoMargen.ABSOLUTO,
            valorBs: 50,
          },
          25,
        ),
      ).toBe(175);
    });

    it('debe manejar costo base 0 o negativo adecuadamente', () => {
      expect(calcularPrecioSugeridoBs(0, null, 0)).toBe(0);
      expect(calcularPrecioSugeridoBs(0, null, 40)).toBe(40);
      expect(calcularPrecioSugeridoBs(-50, null, 10)).toBe(10);
    });
  });

  describe('calcularPrecioSugeridoUsd', () => {
    it('debe calcular sugerido en USD con porcentaje y Math.ceil', () => {
      // 1000 * 1.15 = 1150
      expect(
        calcularPrecioSugeridoUsd(1000, {
          tipoAumento: TipoAumentoMargen.PORCENTAJE,
          valorBs: 15,
          tipoAumentoUsd: TipoAumentoMargen.PORCENTAJE,
          valorUsd: 15,
        }),
      ).toBe(1150);

      // 820.30 * 1.10 = 902.33 -> 903
      expect(
        calcularPrecioSugeridoUsd(820.3, {
          tipoAumento: TipoAumentoMargen.PORCENTAJE,
          valorBs: 15,
          tipoAumentoUsd: TipoAumentoMargen.PORCENTAJE,
          valorUsd: 10,
        }),
      ).toBe(903);
    });

    it('debe calcular sugerido en USD con aumento fijo absoluto', () => {
      // 500 + 80 = 580
      expect(
        calcularPrecioSugeridoUsd(500, {
          tipoAumento: TipoAumentoMargen.PORCENTAJE,
          valorBs: 15,
          tipoAumentoUsd: TipoAumentoMargen.ABSOLUTO,
          valorUsd: 80,
        }),
      ).toBe(580);
    });

    it('debe retornar 0 si costoUsd es 0 o vacio', () => {
      expect(calcularPrecioSugeridoUsd(0, null, 0)).toBe(0);
      expect(calcularPrecioSugeridoUsd(null, null, 0)).toBe(0);
      expect(calcularPrecioSugeridoUsd('', null, 0)).toBe(0);
    });
  });
});
