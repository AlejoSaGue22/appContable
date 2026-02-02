
export interface ClientesResponse {
    count: number;
    pages: number;
    clientes: ClientesInterface[];
}

export interface ClientesInterface {
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
    observacion: string;
    responsableFiscal: string;
}