export interface Empleado {
 id: string;
 tipoDocumento: string;
 numeroDocumento: string;
 primerNombre: string;
 segundoNombre?: string;
 primerApellido: string;
 segundoApellido?: string;
 email?: string;
 telefono?: string;
 direccion?: string;
 centroCosto?: CentroCosto;
 centroCostoId?: string;
 fechaIngreso: string;
 fechaRetiro?: string;
 activo: boolean;
 tipoContrato: string;
 cargo?: Cargo;
 cargoId?: string;
 salarioBase: number;
 salarioIntegral: boolean;
 eps: EntidadSeguridadSocial;
 epsId: string;
 afp: EntidadSeguridadSocial;
 afpId: string;
 ccf?: EntidadSeguridadSocial;
 ccfId?: string;
 arlNivelRiesgo: number;
 auxilioTransporte: boolean;
 banco?: any;
 bancoId?: string;
 tipoCuentaBancaria?: string;
 numeroCuentaBancaria?: string;
 createdAt: string;
 updatedAt: string;
}

export interface CreateEmpleadoDto {
 tipoDocumento: string;
 numeroDocumento: string;
 primerNombre: string;
 segundoNombre?: string;
 primerApellido: string;
 segundoApellido?: string;
 email?: string;
 telefono?: string;
 direccion?: string;
 centroCostoId?: string;
 fechaIngreso: string;
 fechaRetiro?: string;
 tipoContrato: string;
 cargoId?: string;
 salarioBase: number;
 salarioIntegral?: boolean;
 epsId: string;
 afpId: string;
 ccfId?: string;
 arlNivelRiesgo?: number;
 auxilioTransporte?: boolean;
 bancoId?: string;
 tipoCuentaBancaria?: string;
 numeroCuentaBancaria?: string;
}

export interface UpdateEmpleadoDto extends Partial<CreateEmpleadoDto> {}

export interface PeriodoNomina {
 id: string;
 nombre: string;
 fechaInicio: string;
 fechaFin: string;
 tipo: string;
 estado: string;
 fechaPago?: string;
 asientoProvisionId?: string;
 asientoPagoId?: string;
 dianEstado: string;
 dianCune?: string;
 dianNumero?: string;
 dianQrUrl?: string;
 dianFechaEnvio?: string;
 dianFechaAceptacion?: string;
 totalDevengado: number;
 totalDeducciones: number;
 totalNeto: number;
 totalCostoEmpresa: number;
 createdAt: string;
}

export interface CreatePeriodoDto {
 nombre: string;
 fechaInicio: string;
 fechaFin: string;
 tipo: string;
 fechaPago?: string;
}

export interface Liquidacion {
 id: string;
 periodoId: string;
 empleadoId: string;
 empleado: Empleado;
 diasTrabajados: number;
 salarioDevengado: number;
 auxilioTransporte: number;
 totalHorasExtras: number;
 totalBonificaciones: number;
 comisiones: number;
 totalDevengado: number;
 saludEmpleado: number;
 pensionEmpleado: number;
 retencionFuente: number;
 totalDeducciones: number;
 netoPagar: number;
 ibc: number;
 aportesEmpleador: { concepto: string; valor: number }[];
 totalAportes: number;
 provisiones: { concepto: string; valor: number }[];
 totalProvisiones: number;
}

export interface EntidadSeguridadSocial {
 id: string;
 codigo: string;
 nombre: string;
 tipo: string;
 activo: boolean;
}

export interface Cargo {
 id: string;
 codigo: string;
 nombre: string;
 descripcion?: string;
 activo: boolean;
}

export interface CentroCosto {
 id: string;
 codigo: string;
 nombre: string;
 descripcion?: string;
 activo: boolean;
}

export interface PagoNomina {
 id: string;
 periodoId: string;
 periodo?: PeriodoNomina;
 fechaPago: string;
 valor: number;
 cuentaCodigoContable: string;
 banco?: any;
 bancoId?: string;
 numeroComprobante?: string;
 observaciones?: string;
 asientoPagoId: string;
}

export interface PaginatedResponse<T> {
 count: number;
 pages: number;
 data: T[];
}

// ── Reportes ───────────────────────────────────────────────────────
export interface ReporteCostosGrupo {
 id: string;
 codigo: string;
 nombre: string;
 empleados: number;
 totalDevengado: number;
 totalAportes: number;
 totalProvisiones: number;
 totalCosto: number;
}

export interface ReporteCostosResponse {
 data: ReporteCostosGrupo[];
 totales: {
 empleados: number;
 totalDevengado: number;
 totalAportes: number;
 totalProvisiones: number;
 totalCosto: number;
 };
}

export interface ReporteComparativo {
 periodo1: any;
 periodo2: any;
 detalleEmpleados: {
 empleadoId: string;
 empleadoNombre: string;
 periodo1: { devengado: number; deducciones: number; neto: number };
 periodo2: { devengado: number; deducciones: number; neto: number } | null;
 variacion: number | null;
 }[];
}

export interface ReporteResumenAportes {
 periodo: { id: string; nombre: string; tipo: string };
 resumen: { concepto: string; valor: number; empleados: number }[];
 totales: { totalAportes: number; totalEmpleados: number; totalDevengado: number };
 detalleEmpleados: {
 empleadoId: string;
 empleadoNombre: string;
 ibc: number;
 aportes: { concepto: string; valor: number }[];
 totalAportesEmpleado: number;
 }[];
}
