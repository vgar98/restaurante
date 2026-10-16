export type EstadoMesa = 'libre' | 'ocupada' | 'por_cobrar';
export type EstadoItem =
  | 'nuevo'
  | 'en_preparacion'
  | 'listo'
  | 'entregado'
  | 'cancelado';
export type EstadoPedido = 'abierto' | 'pagado' | 'cancelado';

export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
  activa: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  activa: boolean;
}

export interface Plato {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoriaId: number;
  categoria: Categoria;
  disponible: boolean;
}

export interface PedidoItem {
  id: number;
  platoId: number;
  plato: Plato;
  cantidad: number;
  precioUnitario: number;
  notas: string | null;
  estado: EstadoItem;
  creadoEn: string;
}

export interface Pedido {
  id: number;
  mesaId: number;
  mesa: Mesa;
  estado: EstadoPedido;
  items: PedidoItem[];
  notasGenerales: string | null;
 
}


export interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  activo: boolean;
  roles: Rol[];
}

export interface ResumenVentas {
  desde: string;
  hasta: string;
  total: number;
  pedidos: number;
  ticketPromedio: number;
  porMetodo: { metodo: string; total: number; pedidos: number }[];
}

export interface VentaPeriodo {
  periodo: string;
  total: number;
  pedidos: number;
}