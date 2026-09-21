export interface Proveedor {
  id: string;
  nit: string;
  nombre: string;
  contacto: string;
  telefono: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface OrdenPedido {
  id: string;
  remision: string;
  fecha: string;
  estado: 'PENDIENTE' | 'EN PROCESO' | 'COMPLETADA' | 'CANCELADA';
}
