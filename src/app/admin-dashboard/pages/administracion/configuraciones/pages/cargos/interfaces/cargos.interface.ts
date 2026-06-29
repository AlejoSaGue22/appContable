export interface CargoInterface {
    id: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
}

export interface CreateCargoDto {
    codigo: string;
    nombre: string;
    descripcion?: string;
    activo?: boolean;
}

export interface UpdateCargoDto extends Partial<CreateCargoDto> {}
