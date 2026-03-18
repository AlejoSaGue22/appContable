export enum TipoCuentaBancaria {
  AHORROS = 'AHORROS',
  CORRIENTE = 'CORRIENTE',
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
  banco: Banco;
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
  bancoId: string;
  numeroCuenta?: string;
  tipoCuenta: TipoCuentaBancaria;
  observaciones?: string;
  saldoInicial?: number;
}

export interface UpdateCuentaBancariaDto extends Partial<CreateCuentaBancariaDto> {
  activa?: boolean;
}
