import { ClientesInterface } from "./clientes-interface";
import { ProductosInterface } from "./productos-interface";

export interface ComprobanteVentaResponseTemp {
    count:    number;
    pages:    number;
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

// export interface Factura {
//     id: string;
//     cliente: string;
//     vendedor: string;
//     productos: ProductoFactura[];
//     fecha: string;
//     formaPago: string;
//     canalVenta: string;
//     subtotal: string,
//     iva: string;
//     descuento: string;
//     total: string;
// }

// export interface ProductoFactura {
//     id?: string;
//     producto: string;
//     descripcion: string;
//     cantidad: number;
//     valorUnitario: number;
//     descuento: number;
//     descuento_valor: number;
//     iva: number;
//     iva_valor: number;
//     subtotal: number;
//     importe: number;
//     total: number;
// }

export interface ItemFactura {
  id?: string;
  productoId: string;
  producto?: ProductosInterface;
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
  fecha: string | Date;
  formapago: string;
  items: ItemFactura[];
  iva: number;
  descuento: number;
  client: ClientesInterface;
  clientId: string;
  subtotal: number;
  total: number;
  cufe?: string;
  dianStatus: DianStatus;
  createdBy?: string;
  createdById: string;
  createdAt: Date;
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