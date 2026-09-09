const fs = require('fs');
const path = 'C:\\laragon\\www\\Course_Angular_2025\\Contable\\appContable\\src\\app\\admin-dashboard\\pages\\nomina\\interfaces\\nomina.interface.ts';
let c = fs.readFileSync(path, 'utf8');

const newInterfaces = 
export enum EstadoObligacionNomina {
  PENDIENTE = 'PENDIENTE',
  PARCIALMENTE_PAGADA = 'PARCIALMENTE_PAGADA',
  PAGADA = 'PAGADA',
}

export interface ObligacionNomina {
  id: string;
  periodoId: string;
  empleadoId: string;
  terceroId: string | null;
  valorTotal: string | number;
  valorPagado: string | number;
  saldo: string | number;
  estado: EstadoObligacionNomina;
  createdAt: string;
  updatedAt: string;
  periodo?: PeriodoNomina;
  empleado?: Empleado;
}

export interface ObligacionPagoDetalleDto {
  obligacionId: string;
  valorAbono: number;
}

export interface PagarObligacionesDto {
  fechaPago: string;
  cuentaCodigoContable: string;
  bancoId?: string;
  numeroComprobante?: string;
  observaciones?: string;
  detalles: ObligacionPagoDetalleDto[];
}
;

fs.appendFileSync(path, newInterfaces);
