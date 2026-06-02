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
    impuesto: string,
    tipoCodigo?: string,
    tipo?: string,
    // retencion: string,
    precio: string,
    precioventa2: string,
    observacion: string,
    isInventariable?: boolean;
    afectaInventario?: boolean;
}

export interface UnidadMedidaRel {
    id: number;
    codigo: string;
    nombre: string;
    state: boolean;
}

export interface CuentasContablesRel {
    id: string;
    codigo: string;
    nombre: string;
}

export interface CuentasIvaRel {
    id: string;
    codigo: string;
    nombre: string;
}

export interface CategoriaArticuloRel {
    codigo: string;
    cuentaCostoId: string | null;
    cuentaInventarioId: string | null;
    cuentaPrincipalId: string | null;
    descripcion: string;
    id: string;
    manejaInventario: boolean;
    nombre: string;
    state: boolean;
    tipo: string;
}

export interface GetProductosDetalle {
    id: string;
    categoria: string;
    categoriaArticulo: CategoriaArticuloRel;
    categoriaArticuloId: number;
    unidadmedida: number;
    unidadmedidaRel: UnidadMedidaRel;
    nombre: string;
    codigo: string;
    impuesto: string;
    // impuestoRel: ImpuestoRel;
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
    cuentaContable: CuentasContablesRel;
    cuentaContableId: string;
    cuentaIva: CuentasIvaRel;
    cuentaIvaId: string;
    ind: string;
    isInventariable?: boolean;
    afectaInventario?: boolean;
}