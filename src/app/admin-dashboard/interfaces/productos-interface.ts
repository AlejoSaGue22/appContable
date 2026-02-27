export interface ArticulosResponse {
    count: number;
    pages: number;
    articulos: GetProductosDetalle[];
}

export interface ArticulosInterface {
    id: string,
    categoria: string,
    nombre: string,
    codigo: string,
    unidadmedida: string,
    impuesto: number,
    tipoCodigo?: string,
    tipo?: string,
    // retencion: string,
    precio: string,
    precioventa2: string,
    observacion: string,
}


export interface GetProductosDetalle {
    id: string;
    categoria: string;
    fullNameTipo: string;
    unidadmedidaNombre: string;
    unidadmedida: string;
    nombre: string;
    codigo: string;
    impuesto: string;
    retencion: string;
    precio: number;
    precioventa2: string;
    isActive: boolean;
    observacion: string;
    deleteAt: string | null;
    iva_percent: string;
    rete_percent: string;
    estado: string;
    tipo: string;
    tipoCodigo: string;
    ind: string;
}