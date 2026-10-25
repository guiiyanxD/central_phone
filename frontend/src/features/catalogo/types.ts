import { ModeloListItem, TipoDispositivoItem } from '@/lib/api/modelos.api';
import { AccesorioItem, CategoriaAccesorioItem } from '@/lib/api/accesorios.api';

export type CatalogoTab = 'modelos' | 'accesorios';

export type ModeloItem = ModeloListItem;
export type { AccesorioItem, CategoriaAccesorioItem, TipoDispositivoItem };
export type VarianteItem = ModeloListItem['variantes'][number];
