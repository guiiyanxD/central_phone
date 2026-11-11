import { describe, it, expect } from 'vitest';
import { calcularPrecioSugeridoBs, mapearCondicionACategoriaMargen } from './pricing.util';
import { ReglaMargenPrecio } from '@/lib/api/configuracion.api';

describe('pricing.util (Frontend)', () => {
  it('aplica fallback de 15% cuando la regla es nula o indefinida', () => {
    expect(calcularPrecioSugeridoBs(100, null)).toBe(115);
    expect(calcularPrecioSugeridoBs(100, undefined)).toBe(115);
  });

  it('redondea al entero superior con Math.ceil', () => {
    // 3694.05 * 1.15 = 4248.1575 -> 4249
    const reglaPorc: ReglaMargenPrecio = {
      id: 1,
      categoria: 'DISPOSITIVO_NUEVO',
      tipoAumento: 'PORCENTAJE',
      valorBs: 15,
      tipoAumentoUsd: 'PORCENTAJE',
      valorUsd: 15,
    };
    expect(calcularPrecioSugeridoBs(3694.05, reglaPorc)).toBe(4249);
  });

  it('calcula correctamente aumento absoluto en Bolivianos', () => {
    const reglaAbs: ReglaMargenPrecio = {
      id: 2,
      categoria: 'ACCESORIO',
      tipoAumento: 'ABSOLUTO',
      valorBs: 30,
      tipoAumentoUsd: 'ABSOLUTO',
      valorUsd: 5,
    };
    expect(calcularPrecioSugeridoBs(20, reglaAbs)).toBe(50);
  });

  it('suma los gastos al precio sugerido', () => {
    const reglaPorc: ReglaMargenPrecio = {
      id: 3,
      categoria: 'PERMUTA',
      tipoAumento: 'PORCENTAJE',
      valorBs: 10,
      tipoAumentoUsd: 'PORCENTAJE',
      valorUsd: 10,
    };
    // 1000 + 10% = 1100 + 150 gastos = 1250
    expect(calcularPrecioSugeridoBs(1000, reglaPorc, 150)).toBe(1250);
  });

  it('mapea correctamente las condiciones a categorías de margen', () => {
    expect(mapearCondicionACategoriaMargen('NUEVO')).toBe('DISPOSITIVO_NUEVO');
    expect(mapearCondicionACategoriaMargen('PERMUTA')).toBe('PERMUTA');
    expect(mapearCondicionACategoriaMargen('USADO')).toBe('DISPOSITIVO_USADO');
    expect(mapearCondicionACategoriaMargen('OPEN_BOX')).toBe('DISPOSITIVO_USADO');
    expect(mapearCondicionACategoriaMargen(null)).toBe('DISPOSITIVO_USADO');
  });
});
