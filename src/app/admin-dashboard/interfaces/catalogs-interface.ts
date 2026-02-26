export interface CatalogItem {
    id: string;
    nombre: string;
    descripcion?: string;
    codigo?: string;
}

export interface CategoryArticle {
    id: string;
    codigo: string;
    nombre: string;
    tipo: string;
    descripcion?: string;
}

export interface DocumentType {
    id: string;
    codigo: string;
    nombre: string;
    abreviatura: string;
}

export interface PaymentMethod extends CatalogItem {}
export interface SalesChannel extends CatalogItem {}
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
    loading: boolean;
    error: string | null;
}
