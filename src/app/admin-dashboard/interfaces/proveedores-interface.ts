
import { DocumentType, Municipality } from "./catalogs-interface";

export interface ProveedoresResponse {
 count: number;
 pages: number;
 proveedores: ProveedoresRequest[];
}

export interface ProveedoresInterface {
 id: string;
 tipoDocumento: number | string;
 identificacion: string;
 tipoPersona: string;
 razonSocial: string;
 nombre: string;
 apellido: string;
 dv?: string;
 email: string;
 telefono: string;
 direccion: string;
 ciudad: number | string;
 nombreContacto: string;
 telefonoContacto: string;
 observaciones: string;
 isActive: boolean;
 createdAt?: string;
 updatedAt?: string;
 cuentaContableId?: string | null;
}

export interface ProveedoresRequest {
 ciudad: number;
 ciudadRel: Municipality;
 createdAt: string;
 deletedAt: string;
 direccion: string;
 email: string;
 // estado: string;
 id: string;
 ind: string;
 isActive: boolean;
 nombre: string;
 apellido: string;
 tipoPersona: string;
 razonSocial: string;
 dv: string;
 identificacion: string;
 observaciones: string;
 telefono: string;
 tipoDocumento: string;
 tipoDocumentoRel: DocumentType;
 updatedAt: string;
 estado: string;
 nombreContacto: string;
 telefonoContacto: string;
}

