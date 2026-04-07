import { ClientesInterfaceResponse } from "./clientes-interface";
import { CreatedBy } from "./factura-compra-interface";
import { DianStatus, GetFacturaRequest } from "./documento-venta-interface";

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

export interface NotaAjuste {
  id: string;
  tipo: 'CREDITO' | 'DEBITO';
  concepto: string; // Codigo del concepto DIAN
  motivo: string;
  fecha: string;
  fechaVencimiento?: string;
  facturaOriginalId: string;
  facturaOriginal?: GetFacturaRequest;
  items: NotaAjusteItem[];
  metodoPago?: string;
  observaciones?: string;
  status: NotaAjusteStatus;
  dianStatus: DianStatus;
  numero: string;
  prefijo: string;
  cufe?: string;
  total: number;
  iva: number;
  subtotal: number;
  client?: ClientesInterfaceResponse;
  clientId: string;
  createdBy?: CreatedBy;
  createdAt: string;
  mensajeError?: string;
}

export interface NotaAjusteItem {
  id?: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  porcentajeIVA: number;
  discount?: number;
  subtotal?: number;
  total?: number;
}

export enum NotaAjusteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export const ConceptosNotaCredito = [
  { value: '1', label: 'Devolución parcial de bienes/servicios' },
  { value: '2', label: 'Anulación de factura (devolución total)' },
  { value: '3', label: 'Rebaja o descuento' },
  { value: '4', label: 'Ajuste de precio' },
  { value: '5', label: 'Otros conceptos' },
];

export const ConceptosNotaDebito = [
  { value: '1', label: 'Intereses de mora' },
  { value: '2', label: 'Gastos de cobranza' },
  { value: '3', label: 'Ajuste de precio' },
  { value: '4', label: 'Otros conceptos' },
];
