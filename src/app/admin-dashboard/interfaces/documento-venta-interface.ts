export interface ComprobanteVentaResponse {
    count:    number;
    pages:    number;
    comprobantes: Factura[];
}

export interface Factura {
    id: string;
    cliente: string;
    numero: string;
    vendedor: string;
    productos: ProductoFactura[];
    fecha: string;
    formaPago: string;
}

export interface ProductoFactura {
    id: string;
    producto: string;
    descripcion: string;
    cantidad: number;
    valorUnitario: number;
    descuento: number;
    descuento_valor: number;
    importe: number;
    impuestos: string;
    iva_valor: number;
    subtotal: number;
    valorTotal: number;
}