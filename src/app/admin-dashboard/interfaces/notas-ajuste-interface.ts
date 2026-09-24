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
 // ===== Capas NC V2 (guía 2026): snapshot + input + disponibilidad =====
 /** Congelado de la factura fuente (solo lectura). */
 cantidadOriginal?: number;
 precioOriginal?: number;
 subtotalOriginal?: number;
 /** Disponible por concepto (viene de GET disponibilidad). */
 cantidadDisponible?: number;
 descuentoDisponible?: number;
 ajusteDisponible?: number;
 /** Input del usuario según concepto. */
 precioNuevo?: number;
 descuentoValor?: number;
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


/**
 * Conceptos NC según DIAN (alineado con backend ConceptoNotaCredito 1-6).
 * El concepto controla la grilla: columnas, campos editables y cálculo.
 */
export const ConceptosNotaCredito = [
 { value: '1', label: '1 - Devolución parcial / no aceptación parcial' },
 { value: '2', label: '2 - Anulación total' },
 { value: '3', label: '3 - Rebaja o descuento' },
 { value: '4', label: '4 - Ajuste de precio' },
 { value: '5', label: '5 - Descuento comercial por pronto pago' },
 { value: '6', label: '6 - Descuento comercial por volumen' },
];

/** Disponibilidad por concepto (GET /notas-ajuste/disponibilidad/:facturaId). */
export interface DisponibilidadLinea {
 articuloId: string;
 cantidadOriginal: number;
 precioOriginal: number;
 baseOriginal: number;
 ivaOriginal: number;
 totalOriginal: number;
 cantidadAcreditada: number;
 cantidadDisponible: number;
 descuentoAplicado: number;
 descuentoDisponible: number;
 ajusteAplicado: number;
 ajusteDisponible: number;
}

export interface DisponibilidadFactura {
 facturaId: string;
 facturaNumero: string;
 lineas: DisponibilidadLinea[];
 documento: {
  totalFactura: number;
  totalAcreditado: number;
  saldoDisponible: number;
  anulada: boolean;
  bloqueada: boolean;
 };
}

/** Item del DTO V2 (solo el input del concepto). */
export interface NotaCreditoV2Item {
 articuloId: string;
 cantidad?: number;
 precioNuevo?: number;
 descuentoTasa?: number;
 descuentoValor?: number;
}

export interface CreateNotaCreditoV2 {
 facturaOriginalId: string;
 concepto: string;
 motivo: string;
 fecha: string;
 isDraft?: boolean;
 esReembolsoAbono?: boolean;
 aplicarDescuentoATodo?: boolean;
 descuentoTasaGlobal?: number;
 descuentoValorGlobal?: number;
 observaciones?: string;
 items?: NotaCreditoV2Item[];
}

export const ConceptosNotaDebito = [
 { value: '1', label: 'Intereses de mora' },
 { value: '2', label: 'Gastos de cobranza' },
 { value: '3', label: 'Ajuste de precio' },
 { value: '4', label: 'Otros conceptos' },
];
