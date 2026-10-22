// Tipos de dominio para Reportes y Finanzas (Rentabilidad)

export type PresetFecha = 'HOY' | 'SEMANA' | 'MES' | 'CUSTOM';

export interface ReporteResumen {
  totalIngresosBs: number;
  totalCostoMercaderiaBs: number;
  gananciaBrutaBs: number;
  totalGastosOperativosBs: number;
  gananciaNetaRealBs: number;
  margenNetoPorcentaje: number;
  cantidadVentasCompletadas: number;
  cantidadVentasAnuladas: number;
  totalDispositivosVendidos: number;
  totalAccesoriosVendidos: number;
  totalGastosCount: number;
}

export interface TransaccionVentaReporte {
  id: number;
  comprobanteReferencia: string;
  fechaHora: string;
  vendedor: string;
  sucursal: string;
  cliente: string;
  clienteTelefono?: string | null;
  metodoPago: string;
  totalVentaBs: number;
  costoTotalBs: number;
  gananciaBs: number;
  estado: 'COMPLETADA' | 'ANULADA';
  itemsCount: number;
  motivoAnulacion?: string | null;
  anuladoPor?: string | null;
  fechaAnulacion?: string | null;
}

export interface ReporteRentabilidadData {
  resumen: ReporteResumen;
  desgloseMetodosPago: Record<string, number>;
  desgloseGastosPorCategoria: Record<string, number>;
  transacciones: TransaccionVentaReporte[];
}
