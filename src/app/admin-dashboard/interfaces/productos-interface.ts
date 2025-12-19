export interface ProductosResponse {
    count:    number;
    pages:    number;
    productos: ProductosInterface[];
}

export interface ProductosInterface {
      id: string,
      categoria: string,
      nombre: string,
      codigo: string,
      unidadmedida: string,
      impuesto: string,
      retencion: string,
      precioventa1: string,
      precioventa2: string,
      observacion: string,
}


export interface GetProductosDetalle {
    id: string;
    categoria: string;
    nombre: string;
    codigo: string;
    unidadmedida: string;
    impuesto: string;
    retencion: string;
    precioventa1: string;
    precioventa2: string;
    isActive: boolean;
    observacion: string;
    deleteAt: string | null;
    iva_percent: string;
    rete_percent: string;
    estado: string;
    ind: string;
}