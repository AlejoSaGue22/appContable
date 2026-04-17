export interface CatalogItem {
    id: string;
    nombre: string;
    descripcion?: string;
    codigo?: string;
}

export interface CategoryArticle {
    id: number | string;
    codigo: string;
    nombre: string;
    tipo: string;
    descripcion?: string;
    cuentaContableId?: string;
    cuentaContable?: Partial<GetCuentasContables>;
    cuentaIvaId?: string;
    cuentaIva?: Partial<GetCuentasContables>;
    cuentaIvaCodigo?: string;
    state?: boolean;
}

export interface CategoryArticleResponse {
    count: number;
    pages: number;
    categoriesArticles: CategoryArticle[];
}

export interface DocumentType {
    id: string;
    codigo: string;
    nombre: string;
    abreviatura: string;
}
export interface SalesChannel {
    id: number;
    nombre: string;
    descripcion: string;
    codigo: string;
    state: boolean;
}

export interface ConceptNote {
    id: string;
    codigo: string;
    nombre: string;
    state: boolean;
}

export interface PaymentMethod extends CatalogItem {}
export interface UnitMeasure extends CatalogItem {}
export interface Municipality {
    id: string;
    name: string;
    code: string;
    department: string;
}

export interface CatalogsState {
    documentTypes: DocumentType[];
    paymentMethods: PaymentMethod[];
    salesChannels: SalesChannel[];
    unitsMeasure: UnitMeasure[];
    municipalities: Municipality[];
    categoriesArticles: CategoryArticle[];
    conceptsNotes: ConceptNote[];
    loading: boolean;
    error: string | null;
}


export interface GetCuentasContables {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    tipo: string;
    naturaleza: string;
    nivel: number;
    cuentaPadreId: string | null;
    aceptaMovimiento: boolean;
    isActive: boolean;
    totalDebito: number;
    totalCredito: number;
    saldoPropio: number;
    saldo: number;
}
