import { TipoComprobanteInterface } from '../../administracion/configuraciones/pages/tipo-comprobantes/interfaces/tipo-comprobante.interface';

export enum EstadoComprobante {
  BORRADOR = 'BORRADOR',
  CONTABILIZADO = 'CONTABILIZADO',
  ANULADO = 'ANULADO',
}

export interface ComprobanteDetalleInterface {
  id?: string;
  cuentaContableId: string;
  cuentaContable?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  descripcion?: string;
  debito: number;
  credito: number;
  clienteId?: string;
  cliente?: {
    id: string;
    nombre?: string;
    apellido?: string;
    razonSocial?: string;
  };
  proveedorId?: string;
  proveedor?: {
    id: string;
    nombre?: string;
    apellido?: string;
    razonSocial?: string;
  };
  centroCostoId?: string;
  centroCosto?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  documentoReferencia?: string;
}

export interface ComprobanteContableInterface {
  id: string;
  tipoComprobanteId: string;
  tipoComprobante?: TipoComprobanteInterface;
  numero: string;
  fechaDocumento: string;
  fechaContabilizacion?: string;
  estado: EstadoComprobante;
  observaciones?: string;
  asientoId?: string;
  totalDebito: number;
  totalCredito: number;
  creadoPorId: string;
  creadoPor?: {
    id: string;
    fullName: string;
  };
  modificadoPorId?: string;
  contabilizadoPorId?: string;
  anuladoPorId?: string;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  detalles: ComprobanteDetalleInterface[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateComprobanteContableDto {
  tipoComprobanteId: string;
  fechaDocumento: string;
  observaciones?: string;
  detalles: ComprobanteDetalleInterface[];
}

export interface UpdateComprobanteContableDto {
  fechaDocumento?: string;
  observaciones?: string;
  detalles?: ComprobanteDetalleInterface[];
}
