import { DocumentoSoporte } from "./documento-soporte-interface";
import { CuentasContablesRel, GetProductosDetalle } from "./productos-interface";
import { ProveedoresInterface } from "./proveedores-interface";

export interface NotaAjusteSoporteResponse {
  success: boolean;
  data: NotaAjusteSoporte[];
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotaAjusteSoporteResponseById {
  success: boolean;
  data: NotaAjusteSoporte;
  message?: string;
}

export interface NotaAjusteSoporte {
  id: string;
  tipo: 'credito' | 'debito';
  motivo: string;
  conceptoCorreccion?: string | null;
  fecha: string;
  fechaVencimiento?: string;
  documentoOriginalId: string;
  documentoOriginalNumero: string;
  documentoOriginal?: DocumentoSoporte;
  proveedor?: ProveedoresInterface;
  proveedorId?: string;
  items: NotaAjusteSoporteItem[];
  formaPago?: string;
  metodoPago?: string;
  esReembolsoAbono?: boolean;
  observaciones?: string;
  estado: NotaAjusteSoporteStatus;
  numeroCompleto?: string;
  numero?: string;
  prefijo?: string;
  descuento: number;
  total: number;
  iva: number;
  subtotal: number;
  // DIAN
  referenceCode?: string | null;
  dianStatus?: string;
  fechaEnvioDIAN?: string;
  fechaAceptacionDIAN?: string;
  cuds?: string | null;
  qrCode?: string | null;
  publicUrl?: string | null;
  mensajeError?: string | null;
  factusResolutionNumber?: string | null;
  factusRangePrefix?: string | null;
  createdBy?: { email: string };
  createdById?: string;
  createdAt: string;
}

export interface NotaAjusteSoporteItem {
  id?: string;
  descripcion: string;
  articuloId?: string | null;
  articulo?: GetProductosDetalle | null;
  cuentaContableId?: string | null;
  cuentaContable?: CuentasContablesRel | null;
  impuestoId?: string;
  cantidad: number;
  valorUnitario: number;
  porcentajeIVA: number;
  descuento?: number;
  subtotal?: number;
  total?: number;
}

export enum NotaAjusteSoporteStatus {
  DRAFT = 'borrador',
  REGISTRADO = 'registrado',
  ANULADO = 'anulado',
  ERROR_ASIENTO = 'error_asiento'
}
