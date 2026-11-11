import { describe, it, expect } from 'vitest';
import { parseCapacidadBusqueda, matchesDispositivoQuery } from './search.util';

describe('search.util - parseCapacidadBusqueda & matchesDispositivoQuery', () => {
  const dummyPhone = {
    id: 1,
    numeroSerie: 'F2LZ998X1234',
    imei1: '354928112345678',
    imei2: '354928118765432',
    variante: {
      color: 'Azul Titanio',
      capacidadGb: 256,
      tipoSim: 'eSIM',
      modelo: {
        nombreModelo: 'iPhone 15 Pro',
      },
    },
  };

  const dummyMacBook = {
    id: 2,
    numeroSerie: 'C02G12345678',
    imei1: null,
    imei2: null,
    variante: {
      color: 'Gris Espacial',
      capacidadGb: 1024,
      tipoSim: 'No Aplica',
      modelo: {
        nombreModelo: 'MacBook Pro 14 M3',
      },
    },
  };

  describe('parseCapacidadBusqueda', () => {
    it('debe parsear 128, 128gb, 256, 512gb', () => {
      expect(parseCapacidadBusqueda('128')).toBe(128);
      expect(parseCapacidadBusqueda('128GB')).toBe(128);
      expect(parseCapacidadBusqueda('256')).toBe(256);
      expect(parseCapacidadBusqueda('512gb')).toBe(512);
    });

    it('debe parsear 1TB como 1024 GB', () => {
      expect(parseCapacidadBusqueda('1tb')).toBe(1024);
      expect(parseCapacidadBusqueda('1TB')).toBe(1024);
      expect(parseCapacidadBusqueda('1024')).toBe(1024);
    });

    it('debe retornar null para cadenas que no sean tamaños de memoria', () => {
      expect(parseCapacidadBusqueda('esim')).toBeNull();
      expect(parseCapacidadBusqueda('titanio')).toBeNull();
    });
  });

  describe('matchesDispositivoQuery', () => {
    it('debe coincidir por capacidad de memoria (ej: 256, 256gb, 256 gb)', () => {
      expect(matchesDispositivoQuery(dummyPhone, '256')).toBe(true);
      expect(matchesDispositivoQuery(dummyPhone, '256gb')).toBe(true);
      expect(matchesDispositivoQuery(dummyPhone, '256 gb')).toBe(true);
      expect(matchesDispositivoQuery(dummyPhone, '128')).toBe(false);
    });

    it('debe coincidir por 1TB en MacBook (capacidadGb = 1024)', () => {
      expect(matchesDispositivoQuery(dummyMacBook, '1tb')).toBe(true);
      expect(matchesDispositivoQuery(dummyMacBook, '1 tb')).toBe(true);
      expect(matchesDispositivoQuery(dummyMacBook, '1024')).toBe(true);
      expect(matchesDispositivoQuery(dummyMacBook, '512')).toBe(false);
    });

    it('debe coincidir por conectividad / tipoSim (ej: esim)', () => {
      expect(matchesDispositivoQuery(dummyPhone, 'esim')).toBe(true);
      expect(matchesDispositivoQuery(dummyPhone, 'eSIM')).toBe(true);
      expect(matchesDispositivoQuery(dummyMacBook, 'esim')).toBe(false);
    });

    it('debe coincidir con combinaciones multi-palabra (ej: "15 pro 256 esim")', () => {
      expect(matchesDispositivoQuery(dummyPhone, '15 pro 256 esim')).toBe(true);
      expect(matchesDispositivoQuery(dummyPhone, '15 pro 256 titanio')).toBe(true);
      expect(matchesDispositivoQuery(dummyPhone, '15 pro 512')).toBe(false);
    });

    it('debe retornar true si la consulta está vacía', () => {
      expect(matchesDispositivoQuery(dummyPhone, '')).toBe(true);
      expect(matchesDispositivoQuery(dummyPhone, '   ')).toBe(true);
    });
  });
});
