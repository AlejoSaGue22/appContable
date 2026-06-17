export enum TipoCuentaBancaria {
 BANCO = 'Banco',
 CAJA = 'Caja',
}

export interface Banco {
 id: string;
 nombre: string;
 codigo?: string;
 activo?: boolean;
}

export interface CuentaBancaria {
 id: string;
 nombre: string;
 banco: Banco | null;
 tipoCuenta: TipoCuentaBancaria;
 numeroCuenta: string;
 codigoCuentaContable: string;
 activa: boolean;
 saldoInicial: number;
 saldoActual: number;
 observaciones: string;
 createdAt: string;
 updatedAt: string;
}

export interface CreateCuentaBancariaDto {
 nombre: string;
 bancoId?: string;
 numeroCuenta?: string;
 tipoCuenta: TipoCuentaBancaria;
 codigoCuentaContable: string;
 observaciones?: string;
 saldoInicial?: number;
 cuentaContrapartidaCodigo?: string;
}

export interface CreateTransferenciaDto {
 cuentaOrigenId: string;
 cuentaDestinoId: string;
 monto: number;
 observaciones?: string;
}

export interface ResponseCuentasBancarias {
 cuentas: CuentaBancaria[];
 message: string;
 count: number;
 pages: number;
}

export interface ResponseBancos {
 data: Banco[];
 message: string;
}

export interface UpdateCuentaBancariaDto extends Partial<CreateCuentaBancariaDto> {
 activa?: boolean;
}
