import { ClientesInterface } from "./clientes-interface";
import { ArticulosInterface } from "./productos-interface";

export interface ComprobanteVentaResponseTemp {
  count: number;
  pages: number;
  comprobantes: FacturaVenta[];
}

export interface ComprobanteVentaResponse {
  success: boolean;
  data: FacturaVenta[];
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
  discount?: number;
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
  canalventa: string;
  fecha: string;
  formapago: string;
  metodoPago?: string;
  items: ItemFactura[];
  iva: number;
  descuento: number;
  client: ClientesInterface;
  clientId: string;
  subtotal: number;
  total: number;
  cufe?: string;
  dianStatus: DianStatus;
  createdBy?: CreatedBy;
  createdById: string;
  createdAt: Date;
}

interface CreatedBy {
  id: "e5f05bfc-97c1-4397-8ee9-6489c73ce829",
  email: "tejodeveloper@gmail.com",
  fullName: "Tejo Dev",
  isActive: true,
  role: "viewer",
  deleteAt: null
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  CANCELLED = 'cancelled',
  PAID = 'paid'
}

export enum DianStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}