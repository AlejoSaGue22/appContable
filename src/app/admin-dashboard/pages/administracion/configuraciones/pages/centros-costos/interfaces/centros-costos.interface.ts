export interface CentroCostoInterface {
    id: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
}

export interface CreateCentroCostoDto {
    codigo: string;
    nombre: string;
    descripcion?: string;
    activo?: boolean;
}

export interface UpdateCentroCostoDto extends Partial<CreateCentroCostoDto> {}
