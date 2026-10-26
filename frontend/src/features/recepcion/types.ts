// Tipos de dominio para Recepción de Mercadería (Notas de Ingreso)

export interface TelefonoRow {
  id: string;
  varianteId: number | null;
  nuevaVariante?: {
    modeloId: number;
    color: string;
    capacidadGb: number;
    tipoSim: string;
  };
  modeloNombreDisplay?: string;
  modeloTipo?: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO';
  varianteDisplay?: string;
  varianteTipoSim?: string;
  imei1: string;
  imei2: string;
  numeroSerie: string;
  condicion: 'NUEVO' | 'USADO' | 'OPEN_BOX';
  costoBs: number;
  costoUsd: number;
  precioVentaSugeridoBs: number;
}

export interface AccesorioRow {
  id: string;
  accesorioId: number | null;
  nuevoAccesorio?: {
    categoriaId: number;
    nombre: string;
    descripcion?: string;
  };
  accesorioDisplay?: string;
  nombreDiferenciador: string;
  cantidad: number;
  costoUnitarioBs: number;
  precioVentaBs: number;
}
