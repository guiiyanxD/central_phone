import { ModeloListItem } from '@/lib/api/modelos.api';
import { AccesorioItem, CategoriaAccesorioItem } from '@/lib/api/accesorios.api';

export type CatalogoTab = 'modelos' | 'accesorios';

export type ModeloItem = ModeloListItem;
export type { AccesorioItem, CategoriaAccesorioItem };
export type VarianteItem = ModeloListItem['variantes'][number];
