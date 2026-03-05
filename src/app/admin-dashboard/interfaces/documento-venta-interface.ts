import { ClientesInterfaceResponse } from "./clientes-interface";
import { CreatedBy } from "./factura-compra-interface";
import { ArticulosInterface } from "./productos-interface";

// export interface ComprobanteVentaResponseTemp {
//   count: number;
//   pages: number;
//   comprobantes: FacturaVenta[];
// }

export interface ComprobanteVentaResponse {
  success: boolean;
  data: GetFacturaRequest[];
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ItemFactura {
  id?: string;
  articuloId: string;
  articulo?: ArticulosInterface;
  description: string;
  unitPrice: number;
  iva: number;
  valor_iva?: number;
  discount: number;
  valor_discount?: number;
  quantity: number;
  subtotal?: number;
  importe: number;
  total?: number;
}

export interface FacturaVenta {
  id: string;
  prefijo: string;
  comprobante: string;
  comprobante_completo: string;
  status: InvoiceStatus;
  vendedor: string;
  canalVenta: number;
  fecha: string;
  tipoFactura: TipoFactura;
  formaPago: FormaPago;
  metodoPago?: string;
  fechaVencimiento?: string;
  items: ItemFactura[];
  iva: number;
  descuento: number;
  client: ClientesInterfaceResponse;
  clientId: string;
  subtotal: number;
  total: number;
  cufe?: string;
  dianStatus: DianStatus;
  createdBy?: CreatedBy;
  createdById: string;
  createdAt: Date;
}

export interface GetFacturaRequest {
  id: string;
  tipoFactura: TipoFactura;
  prefijo: string;
  comprobante: string;
  comprobante_completo: string;
  status: InvoiceStatus;
  dianStatus: DianStatus;
  vendedor: string | null;
  canalVenta: number;
  formaPago: FormaPago;
  metodoPago: string | null;
  metodoPagoRel: {
    id: number;
    codigo: string;
    nombre: string;
    state: boolean;
  };
  fecha: string; // ISO date (YYYY-MM-DD)
  fechaVencimiento: string | null;
  asientoError: string | null;
  fechaAsientoError: string | null;
  items: GetFacturaItemRequest[];
  iva: number;
  descuento: number;
  client: ClientesInterfaceResponse;
  clientId: string;
  subtotal: number;
  total: number;
  cufe: string | null;
  xmlUrl: string | null;
  pdfUrl: string | null;
  qrCode: string | null;
  proveedorResponse: string | null;
  dianResponse: string | null;
  mensajeError: string | null;
  fechaEnvioDIAN: string | null;
  fechaAceptacionDIAN: string | null;
  intentosEnvio: number;
  observaciones: string | null;
  createdBy: CreatedBy;
  createdById: string;
  createdAt: string; // ISO datetime
}

interface GetFacturaItemRequest {
  id: string;
  articulo: ArticulosInterface;
  articuloId: string;
  description: string;
  unitPrice: number;
  iva: number;
  valor_iva: number;
  discount: number;
  valor_discount: number;
  quantity: number;
  subtotal: number;
  importe: number;
  total: number;
  facturaId: string;
  createdAt: string; // ISO datetime
}

export enum TipoFactura {
  ELECTRONICA = 'ELECTRONICA',
  STANDARD = 'ESTANDAR',
}

export enum FormaPago {
  CONTADO = 'CONTADO',
  CREDITO = 'CREDITO',
}

export enum InvoiceStatus {
  DRAFT = 'draft',              // Borrador - editable
  PENDING_DIAN = 'pending_dian', // Enviando a DIAN
  ACCEPTED = 'accepted',         // Aceptada por DIAN (tiene CUFE)
  REJECTED = 'rejected',         // Rechazada por DIAN (corregir y reenviar)
  PAID = 'paid',                 // Pagada
  CANCELLED = 'cancelled',        // Anulada (requiere nota crédito)
  ISSUED = 'issued',             // Emitida (para facturas comunes)
  ERROR_ASIENTO = 'error_asiento' // Error generado el asiento
}

export enum DianStatus {
  PENDING = 'pending',           // Esperando envío
  SENT = 'sent',                 // Enviada a proveedor tecnológico
  PROCESSING = 'processing',     // Proveedor validando
  ACCEPTED = 'accepted',         // DIAN aprobó (tiene CUFE)
  REJECTED = 'rejected',         // DIAN rechazó
  CANCELLED = 'cancelled'        // Anulada (nota crédito enviada)
}