import { describe, it, expect } from 'vitest';
import { formatImeiChunks, getImeiTerminalParts, formatCurrencyBs } from './formatters';

describe('POS Formatters', () => {
  describe('formatImeiChunks', () => {
    it('debe formatear un IMEI estándar de 15 dígitos en bloques de 4-4-4-3', () => {
      expect(formatImeiChunks('358492118492013')).toBe('3584 9211 8492 013');
    });

    it('debe limpiar caracteres no numéricos previos y formatear correctamente', () => {
      expect(formatImeiChunks('3584-9211-8492-013')).toBe('3584 9211 8492 013');
    });

    it('debe devolver la cadena original si no tiene exactamente 15 dígitos', () => {
      expect(formatImeiChunks('12345')).toBe('12345');
      expect(formatImeiChunks('')).toBe('');
      expect(formatImeiChunks(undefined)).toBe('');
    });
  });

  describe('getImeiTerminalParts', () => {
    it('debe separar el prefijo y los últimos 4 dígitos terminales', () => {
      const parts = getImeiTerminalParts('358492118492013');
      expect(parts.prefix).toBe('3584 9211 849 ');
      expect(parts.terminal).toBe('2013');
    });
  });

  describe('formatCurrencyBs', () => {
    it('debe formatear números con símbolo Bs y 2 decimales', () => {
      const formatted = formatCurrencyBs(1500);
      expect(formatted).toContain('Bs');
      expect(formatted).toContain('500');
    });
  });
});
