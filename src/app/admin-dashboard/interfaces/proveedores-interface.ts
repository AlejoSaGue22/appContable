
import { DocumentType, Municipality } from "./catalogs-interface";

export interface ProveedoresResponse {
    count: number;
    pages: number;
    proveedores: ProveedoresRequest[];
}

export interface ProveedoresInterface {
    id: string;
    tipoDocumento: string;
    identificacion: string;
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    nombreContacto: string;
    telefonoContacto: string;
    observaciones: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProveedoresRequest {
    ciudad: number;
    ciudadRel: Municipality;
    createdAt: string;
    deletedAt: string;
    direccion: string;
    email: string;
    estado: string;
    id: string;
    ind: string;
    isActive: boolean;
    nombre: string;
    identificacion: string;
    observaciones: string;
    telefono: string;
    tipoDocumento: string;
    tipoDocumentoRel: DocumentType;
    updatedAt: string;
}

