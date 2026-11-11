import { parseCapacidadBusqueda } from './search-query.util';

describe('search-query.util - parseCapacidadBusqueda', () => {
  it('debe parsear capacidades en gigabytes estándar con sufijo GB', () => {
    expect(parseCapacidadBusqueda('64gb')).toBe(64);
    expect(parseCapacidadBusqueda('128GB')).toBe(128);
    expect(parseCapacidadBusqueda('256gb')).toBe(256);
    expect(parseCapacidadBusqueda('512Gb')).toBe(512);
  });

  it('debe parsear terabytes y convertirlos a gigabytes (1TB = 1024, 2TB = 2048)', () => {
    expect(parseCapacidadBusqueda('1tb')).toBe(1024);
    expect(parseCapacidadBusqueda('1TB')).toBe(1024);
    expect(parseCapacidadBusqueda('2tb')).toBe(2048);
  });

  it('debe soportar números puros correspondientes a capacidades habituales', () => {
    expect(parseCapacidadBusqueda('64')).toBe(64);
    expect(parseCapacidadBusqueda('128')).toBe(128);
    expect(parseCapacidadBusqueda('256')).toBe(256);
    expect(parseCapacidadBusqueda('512')).toBe(512);
    expect(parseCapacidadBusqueda('1024')).toBe(1024);
  });

  it('debe soportar sufijo "g" abreviado', () => {
    expect(parseCapacidadBusqueda('128g')).toBe(128);
    expect(parseCapacidadBusqueda('256G')).toBe(256);
  });

  it('debe retornar null para términos que no son capacidades', () => {
    expect(parseCapacidadBusqueda('')).toBeNull();
    expect(parseCapacidadBusqueda('iphone')).toBeNull();
    expect(parseCapacidadBusqueda('esim')).toBeNull();
    expect(parseCapacidadBusqueda('azul')).toBeNull();
    expect(parseCapacidadBusqueda('999')).toBeNull();
    expect(parseCapacidadBusqueda('50')).toBeNull();
  });
});
