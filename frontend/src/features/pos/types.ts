export interface CartItem {
  cartId: string;
  tipo: 'DISPOSITIVO' | 'ACCESORIO';
  dispositivoId?: number;
  loteAccesorioId?: number;
  nombre: string;
  subtitulo: string;
  imei?: string;
  serie?: string;
  stockMaximo?: number;
  cantidad: number;
  precioUnitarioBs: number;
  precioSugeridoOriginal?: number;
}
