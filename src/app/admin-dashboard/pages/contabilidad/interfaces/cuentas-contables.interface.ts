export interface GetCuentasContables {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    tipo: string;
    naturaleza: string;
    nivel: number;
    cuentaPadreId: string | null;
    aceptaMovimiento: boolean;
    isActive: boolean;
    totalDebito: number;
    totalCredito: number;
    saldoPropio: number;
    saldo: number;
}
