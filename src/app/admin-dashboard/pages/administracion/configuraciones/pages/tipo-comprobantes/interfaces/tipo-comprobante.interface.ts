export interface TipoComprobanteInterface {
  id: string;
  codigo: string;
  nombre: string;
  prefijo?: string;
  consecutivoActual: number;
  numeracionAutomatica: boolean;
  activo: boolean;
  requiereAprobacion: boolean;
  docReferenciaObligatorio: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTipoComprobanteDto {
  codigo: string;
  nombre: string;
  prefijo?: string;
  consecutivoActual?: number;
  numeracionAutomatica?: boolean;
  activo?: boolean;
  requiereAprobacion?: boolean;
  docReferenciaObligatorio?: boolean;
}

export interface UpdateTipoComprobanteDto {
  nombre?: string;
  prefijo?: string;
  consecutivoActual?: number;
  numeracionAutomatica?: boolean;
  activo?: boolean;
  requiereAprobacion?: boolean;
  docReferenciaObligatorio?: boolean;
}
