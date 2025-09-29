export interface Factura {
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
    impuestos: string;
    subtotal: number;
    valorTotal: number;
}