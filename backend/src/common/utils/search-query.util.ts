/**
 * Analiza un término de búsqueda y determina si corresponde a una capacidad de almacenamiento.
 * Soporta entradas como: "128", "128gb", "128 gb", "128g", "1tb", "1 tb", "2tb", "2 tb".
 * Convierte TB a GB (1TB = 1024GB, 2TB = 2048GB).
 * Retorna el número en GB o null si no es una capacidad reconocida.
 */
export function parseCapacidadBusqueda(term: string): number | null {
  if (!term) return null;
  const clean = term.toLowerCase().trim();

  // 1tb, 2tb -> 1024, 2048
  const tbMatch = clean.match(/^(\d+)\s*tb$/);
  if (tbMatch) {
    return parseInt(tbMatch[1], 10) * 1024;
  }

  // 16gb, 32gb, 64gb, 128gb, 256gb, 512gb, 1024gb, o sufijo 'g'
  const gbMatch = clean.match(/^(\d+)\s*(?:gb|g)$/);
  if (gbMatch) {
    return parseInt(gbMatch[1], 10);
  }

  // Si son dígitos puros (ej: "128", "256", "512", "64", "1024")
  if (/^\d+$/.test(clean)) {
    const num = parseInt(clean, 10);
    const storageSizes = [16, 32, 64, 128, 256, 512, 1024, 2048];
    if (storageSizes.includes(num)) {
      return num;
    }
  }

  return null;
}
