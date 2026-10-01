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
 requiereTercero: boolean;
 requiereCentroCostos: boolean;
 isActive: boolean;
 isSystemAccount: boolean;
 totalDebito: number;
 totalCredito: number;
 saldoPropio: number;
 saldo: number;
}
