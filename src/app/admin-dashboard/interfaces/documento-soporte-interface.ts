import { CuentaBancaria, PaymentStatus } from "./pagos-interface";
import { ArticulosInterface, CuentasContablesRel } from "./productos-interface";
import { FacturaNotasResumen } from "./documento-venta-interface";
import { ProveedoresInterface } from "./proveedores-interface";

export interface DocumentoSoporteResponse {
    success: boolean;
    data: DocumentoSoporte[];
    message?: string;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export enum TipoDocumentoSoporte {
    ESTANDAR = 'estandar',
    ELECTRONICO = 'electronico'
}

export enum DianStatusSoporte {
    PENDING = 'pending',
    SENT = 'sent',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected'
}

export enum DocumentoSoporteEstado {
    BORRADOR = 'borrador',
    ERROR_ASIENTO = 'error_asiento',
    PAGADO = 'pagado',
    REGISTRADO = 'registrado',
    ANULADO = 'anulado'
}

export interface DocumentoSoporte {
    id: string;
    isDraft: boolean;
    proveedorId: string;
    numero: string | null;
    numeroFacturaProveedor: string;
    tipo: TipoDocumentoSoporte;
    estado: DocumentoSoporteEstado;
    fecha: string;
    fechaVencimiento?: string;
    formaPago: string;
    metodoPago?: string;
    metodoPagoRel?: { nombre: string };
    cuentaBancariaId?: string;
    cuentaBancaria?: CuentaBancaria;
    observaciones?: string;
    generationMode: string;
    periodStartDate?: string | null;
    totalPagado: number;
    saldoPendiente: number;
    paymentStatus: PaymentStatus;
    items: ItemDocumentoSoporte[];
    iva: number;
    descuento: number;
    proveedor: ProveedoresInterface;
    subtotal: number;
    total: number;
    // DIAN
    referenceCode?: string | null;
    numeroDian?: string | null;
    dianStatus: DianStatusSoporte;
    fechaEnvioDIAN?: string;
    fechaAceptacionDIAN?: string;
    cuds?: string | null;
    qrCode?: string | null;
    qrImageBase64?: string | null;
    publicUrl?: string | null;
    xmlUrl?: string | null;
    pdfUrl?: string | null;
    mensajeError?: string | null;
    intentosEnvio?: number;
    factusResolutionNumber?: string | null;
    factusRangePrefix?: string | null;
    notasResumen?: FacturaNotasResumen;
    asientoError?: string;
    createdBy?: { email: string };
    createdById: string;
    createdAt: Date;
}

export interface ItemDocumentoSoporte {
    id?: string;
    articuloId?: string | null;
    articulo?: ArticulosInterface | null;
    cuentaContableId?: string | null;
    cuentaContable?: CuentasContablesRel | null;
    impuestoRel?: { id: string };
    documentoSoporteId?: string;
    descripcion?: string;
    unitPrice: number;
    porcentajeIva: number;
    impuestoId?: string;
    valorIva?: number;
    descuento?: number;
    valorDescuento?: number;
    quantity: number;
    valorSubtotal?: number;
    itemTotal?: number;
    createdAt?: Date;
}
