import { FacturaCompra } from "./factura-compra-interface";
import { CreatedBy } from "./factura-compra-interface";
import { GetProductosDetalle } from "./productos-interface";

export interface NotaAjusteCompraResponse {
  success: boolean;
  data: NotaAjusteCompra[];
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotaAjusteCompraResponseById {
  success: boolean;
  data: NotaAjusteCompra;
  message?: string;
}

export interface NotaAjusteCompra {
  id: string;
  tipo: 'credito';
  motivo: string;
  fecha: string;
  fechaVencimiento?: string;
  facturaOriginalId: string;
  facturaOriginalNumero: string;
  facturaOriginal?: FacturaCompra;
  items: NotaAjusteCompraItem[];
  formaPago?: string;
  metodoPago?: string;
  esReembolsoAbono?: boolean;
  observaciones?: string;
  estado: NotaAjusteCompraStatus;
  numeroCompleto?: string;
  prefijo?: string;
  descuento: number;
  total: number;
  iva: number;
  subtotal: number;
  createdBy?: CreatedBy;
  createdById?: string;
  createdAt: string;
  mensajeError?: string;
}

export interface NotaAjusteCompraItem {
  id?: string;
  descripcion: string;
  articuloId: string;
  articulo?: GetProductosDetalle;
  impuestoId?: string;
  cantidad: number;
  valorUnitario: number;
  porcentajeIVA: number;
  descuento?: number;
  subtotal?: number;
  total?: number;
}

export enum NotaAjusteCompraStatus {
  DRAFT = 'borrador',
  REGISTRADO = 'registrado',
  ANULADO = 'anulado',
  ERROR_ASIENTO = 'error_asiento'
}
