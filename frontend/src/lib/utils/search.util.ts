/**
 * Utilidad de búsqueda inteligente para dispositivos físicos.
 * Soporta parsing de capacidad de almacenamiento (GB/TB) y coincidencias de conectividad (SIM).
 */

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

/**
 * Evalúa si un dispositivo coincide con una consulta de búsqueda multi-término.
 * Cada palabra de la consulta debe coincidir con al menos un atributo del equipo:
 * IMEI, Serie, Nombre del Modelo, Color, Conectividad (tipoSim) o Capacidad de Memoria.
 */
export function matchesDispositivoQuery(dispositivo: any, query: string): boolean {
  if (!query || !query.trim()) return true;

  // Normalizar unidades de almacenamiento separadas con espacio (ej: "128 gb" -> "128gb", "1 tb" -> "1tb")
  const normalized = query.trim().replace(/(\d+)\s+(gb|tb|g)\b/gi, '$1$2');
  const terms = normalized.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const capGb = Number(dispositivo.variante?.capacidadGb || 0);
  const capAliases: string[] = [];
  if (capGb > 0) {
    capAliases.push(String(capGb));
    capAliases.push(`${capGb}gb`);
    capAliases.push(`${capGb}g`);
    if (capGb >= 1024) {
      const tb = capGb / 1024;
      capAliases.push(`${tb}tb`);
      capAliases.push(`${tb} tb`);
    }
  }

  const imei1 = (dispositivo.imei1 || '').toLowerCase();
  const imei2 = (dispositivo.imei2 || '').toLowerCase();
  const serie = (dispositivo.numeroSerie || '').toLowerCase();
  const modelo = (
    dispositivo.variante?.modelo?.nombreModelo ||
    dispositivo.variante?.modelo?.nombre ||
    ''
  ).toLowerCase();
  const color = (dispositivo.variante?.color || '').toLowerCase();
  const tipoSim = (dispositivo.variante?.tipoSim || '').toLowerCase();

  return terms.every((term) => {
    const parsedCap = parseCapacidadBusqueda(term);
    const matchesCapacity =
      (parsedCap !== null && capGb === parsedCap) ||
      capAliases.some((alias) => alias === term || alias.startsWith(term));

    return (
      matchesCapacity ||
      imei1.includes(term) ||
      imei2.includes(term) ||
      serie.includes(term) ||
      modelo.includes(term) ||
      color.includes(term) ||
      tipoSim.includes(term)
    );
  });
}
