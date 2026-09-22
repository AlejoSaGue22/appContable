import { ClientesInterfaceResponse } from "./clientes-interface";
import { CreatedBy } from "./factura-compra-interface";
import { DianStatus, GetFacturaRequest } from "./documento-venta-interface";
import { GetProductosDetalle } from "./productos-interface";

export interface NotaAjusteResponse {
 success: boolean;
 data: NotaAjuste[];
 message?: string;
 meta?: {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
 };
}

export interface NotaAjusteResponseById {
 success: boolean;
 data: NotaAjuste;
 message?: string;
}

export interface NotaAjuste {
 id: string;
 tipo: 'credito' | 'debito';
 concepto: string; // Codigo del concepto DIAN
 motivo: string;
 fecha: string;
 fechaVencimiento?: string;
 facturaOriginalId: string;
 facturaOriginalNumero: string;
 facturaOriginal?: GetFacturaRequest;
 items: NotaAjusteItem[];
 formaPago?: string; // 'CONTADO' | 'CREDITO'
 metodoPago?: string;
 esReembolsoAbono?: boolean; // true si la NC es un reembolso de un abono previo en factura crédito
 observaciones?: string;
 estado: NotaAjusteStatus;
 dianStatus?: DianStatus | string;
 estadoDIAN?: NotaDianStatus | string;
 fechaAceptacionDIAN?: Date;
 fechaEnvioDIAN?: Date;
 numero: string;
 numeroCompleto?: string;
 prefijo: string;
 cufe?: string;
 cude?: string;
 xmlUrl?: string;
 pdfUrl?: string;
 qrCode?: string;
 proveedorResponse?: any;
 descuento: number;
 total: number;
 iva: number;
 subtotal: number;
 cliente?: ClientesInterfaceResponse;
 clienteId: string;
  createdBy?: CreatedBy;
  createdAt: string;
  mensajeError?: string;
  factusNumberingRangeId?: number | null;
  factusResolutionNumber?: string | null;
  factusRangePrefix?: string | null;
}

export interface NotaAjusteItem {
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

export enum NotaAjusteStatus {
 DRAFT = 'borrador',
 ISSUED = 'emitida',
 SENT = 'enviada',
 PROCESSING = 'procesando',
 ACCEPTED = 'aceptada',
 REJECTED = 'rechazada',
 CANCELLED = 'anulada',
 ERROR_ASIENTO = 'error_asiento'
}

/**
 * Estados DIAN de la nota (valores del backend: EstadoDIANNota).
 * Se mantiene separado de DianStatus (facturas, en inglés).
 */
export enum NotaDianStatus {
 NO_APLICA = 'no_aplica',
 PENDIENTE = 'pendiente',
 ENVIADA = 'enviada',
 PROCESANDO = 'procesando',
 ACEPTADA = 'aceptada',
 RECHAZADA = 'rechazada',
 ANULADA = 'anulada'
}


export const ConceptosNotaCredito = [
 { value: '1', label: 'Descuento comercial por volumen de ventas' },
 { value: '2', label: 'Ajuste de precio' },
 { value: '3', label: 'Devolución de bienes' },
 { value: '4', label: 'Ajuste de precio' },
 { value: '5', label: 'Otros conceptos' },
];

export const ConceptosNotaDebito = [
 { value: '1', label: 'Intereses de mora' },
 { value: '2', label: 'Gastos de cobranza' },
 { value: '3', label: 'Ajuste de precio' },
 { value: '4', label: 'Otros conceptos' },
];
