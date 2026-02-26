
export interface ProveedoresResponse {
    count: number;
    pages: number;
    proveedores: ProveedoresInterface[];
}

export interface ProveedoresInterface {
    id: string;
    tipoDocumento: string;
    identificacion: string;
    tipoDocumento_nombre?: string;
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
