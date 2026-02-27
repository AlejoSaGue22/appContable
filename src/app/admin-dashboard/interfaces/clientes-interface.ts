
import { DocumentType, Municipality } from "./catalogs-interface";

export interface ClientesResponse {
    count: number;
    pages: number;
    clientes: ClientesInterfaceResponse[];
}

export interface ClientesFormInterface {
    id: string;
    nombre: string;
    apellido: string;
    tipoPersona: string;
    razonSocial: string;
    tipoDocumento: string;
    numeroDocumento: string;
    direccion: string;
    ciudad: string;
    telefono: string;
    email: string;
    tributo: string;
    isActive: boolean;
    observacion: string;
    responsableFiscal: string;
    dv?: string;
}

export interface ClientesInterfaceResponse {
    id: string;
    apellido: string;
    ciudad: number;
    ciudadRel: Municipality;
    deleteAt: string;
    direccion: string;
    dv: string;
    email: string;
    estado: string;
    fullName: string;
    ind: string;
    isActive: boolean;
    nombre: string;
    numeroDocumento: string;
    observacion: string;
    razonSocial: string;
    responsableFiscal: string;
    telefono: string;
    tipoDocumento: string;
    tipoDocumentoRel: DocumentType
    tipoPersona: string;
    tipoPersona_nom: string;
    tributo: string;
}
