import { PaymentStatus } from "./pagos-interface";
import { ArticulosInterface } from "./productos-interface";
import { ProveedoresInterface } from "./proveedores-interface";

export interface ComprobanteCompraResponseTemp {
    count: number;
    pages: number;
    comprobantes: FacturaCompra[];
}

export interface ComprobanteCompraResponse {
    success: boolean;
    data: FacturaCompra[];
    message?: string;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface FacturaCompra {
    id: string;
    proveedorId: string;
    numero: string;
    status: InvoiceCompraStatus;
    fecha: string;
    fechaVencimiento?: string;
    formaPago: string;
    metodoPago?: string;
    observaciones?: string;
    totalPagado: number;
    saldoPendiente: number;
    paymentStatus: PaymentStatus;
    items: ItemFactura[];
    iva: number;
    descuento: number;
    proveedor?: ProveedoresInterface;
    subtotal: number;
    total: number;
    createdBy?: CreatedBy;
    createdById: string;
    createdAt: Date;
}

export interface ItemFactura {
    id?: string;
    articuloId: string;
    articulo?: ArticulosInterface;
    description?: string;
    unitPrice: number;
    iva: number;
    valor_iva?: number;
    discount?: number;
    valor_discount?: number;
    quantity: number;
    subtotal?: number;
    importe?: number;
    total?: number;
}

export interface ItemFacturaResponse {
    id?: string;
    articuloId: string;
    articulo?: ArticulosInterface;
    facturaCompraId: string;
    description?: string;
    unitPrice: number;
    porcentajeIva: number;
    descuento?: number;
    valorDescuento?: number;
    quantity: number;
    valorSubtotal?: number;
    itemTotal?: number;
    createdAt: Date;
}

export enum InvoiceCompraStatus {
    BORRADOR = 'borrador',
    ERROR_ASIENTO = 'error_asiento',
    REGISTRADO = 'registrado',
    PAGADO = 'pagado',
    ANULADO = 'anulado'
}


export interface CreatedBy {
    id: string,
    email: string,
    fullName: string,
    isActive: boolean,
    role: string,
    deleteAt: Date | null
}
