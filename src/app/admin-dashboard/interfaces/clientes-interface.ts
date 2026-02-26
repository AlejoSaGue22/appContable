
export interface ClientesResponse {
    count: number;
    pages: number;
    clientes: ClientesInterfaceResponse[];
}

export interface ClientesInterfaceResponse {
    id: string;
    fullName: string;
    nombre: string;
    apellido: string;
    tipoPersona: string;
    tipoPersona_nom: string;
    razonSocial: string;
    tipoDocumento: string;
    tipoDocumento_nom: string;
    numeroDocumento: string;
    direccion: string;
    ciudad: string;
    telefono: string;
    email: string;
    tributo: string;
    tributo_nom: string;
    isActive: boolean;
    observacion: string;
    responsableFiscal: string;
    dv?: string;
    deletedAt: string;
}

export interface ClientesFormInterface {
    id: string;
    nombre: string;
    apellido: string;
    tipoDocumento: string;
    numeroDocumento: string;
    tipoPersona: string;
    razonSocial: string;
    direccion: string;
    ciudad: string;
    telefono: string;
    email: string;
    isActive: boolean;
    observacion: string;
    responsableFiscal: string;
    dv?: string;
}
