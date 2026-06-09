export interface Vendedor {
  id?: string;
  nombre: string;
  apellido: string;
  identificacion: string;
  telefono?: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
