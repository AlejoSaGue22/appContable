// src/app/pagos/models/pagos.models.ts

export type PaymentStatus = 'pendiente' | 'parcial' | 'pagado' | 'vencido';
export type MedioPago = 'caja' | 'banco' | 'transferencia' | 'cheque';
export type TipoPago = 'cobro' | 'pago' | 'otro_ingreso' | 'otro_egreso';

// ── Envelope genérico del backend ──────────────────────────────────────────

export interface PagoMetaDto {
 total?: number;
 page?: number;
 limit?: number;
 [key: string]: unknown;
}

export interface PagoResponseDto<T> {
 success: boolean;
 data: T;
 message?: string;
 meta?: PagoMetaDto;
}

// ── CxC ────────────────────────────────────────────────────────────────────

export interface CxcItem {
 facturaId: string;
 numeroFactura: string;
 clienteId: string;
 clienteNombre: string;
 fechaEmision: string;
 fechaVencimiento: string | null;
 diasVencida: number;
 total: number;
 totalPagado: number;
 saldoPendiente: number;
 paymentStatus: PaymentStatus;
 agingBucket: AgingBucket;
}

export interface CxcResumen {
 totalCartera: number;
 porVencer: number;
 vencida: number;
 cantidadPorVencer: number;
 cantidadVencida: number;
}

export interface CxcResponse {
 items: CxcItem[];
 resumen: CxcResumen;
 meta: {
 page: number;
 total: number;
 totalPages: number;
 };
}

// ── CxP ────────────────────────────────────────────────────────────────────

export interface CxpItem {
 facturaId: string;
 numeroFactura: string;
 proveedorId: string;
 proveedorNombre: string;
 fechaEmision: string;
 fechaVencimiento: string | null;
 diasVencida: number;
 total: number;
 totalPagado: number;
 saldoPendiente: number;
 paymentStatus: PaymentStatus;
 agingBucket: AgingBucket;
}

export interface CxpResumen {
 totalPorPagar: number;
 porVencer: number;
 vencida: number;
 cantidadPorVencer: number;
 cantidadVencida: number;
}

export interface CxpResponse {
 items: CxpItem[];
 resumen: CxpResumen;
 meta: {
 page: number;
 total: number;
 totalPages: number;
 };
}

export interface CxFiltros {
 clienteId?: string;
 proveedorId?: string;
 paymentStatus?: PaymentStatus;
 soloVencidas?: boolean;
 page: number;
 limit: number;
}

// ── Aging ──────────────────────────────────────────────────────────────────

export type AgingBucket = 'porVencer' | 'de1a30' | 'de31a60' | 'de61a90' | 'mas90';

export interface AgingRow {
 id: string;
 numero: string;
 contraparte: string;
 emision: string;
 vencimiento: string | null;
 diasVencida: number;
 total: number;
 pagado: number;
 saldo: number;
 paymentStatus: PaymentStatus;
 bucket: AgingBucket;
}

export interface AgingGroup {
 contraparteId: string;
 contraparteNombre: string;
 porVencer: number;
 de1a30: number;
 de31a60: number;
 de61a90: number;
 mas90: number;
 total: number;
 facturas: AgingRow[];
}

export interface AgingReporte {
 grupos: AgingGroup[];
 totales: {
 porVencer: number;
 de1a30: number;
 de31a60: number;
 de61a90: number;
 mas90: number;
 total: number;
 };
 generadoEn: string;
}

// ── Pagos / Historial ──────────────────────────────────────────────────────

export interface PagoHistorialResponse {
 data: PagoHistorial[];
 message: string;
 success: boolean;
}

export interface PagoHistorial {
 id: string;
 numero: string;
 tipo: TipoPago;
 fecha: string;
 monto: number;
 medioPago: MedioPago;
 referencia: string | null;
 numeroFactura: string;
 contraparte: string;
 numeroContraparte: string;
 creadoPor: string;
 asientoId: number | null;
 cuentaBancaria?: {
 id: string;
 nombre: string;
 numeroCuenta: string;
 banco: {
 id: string;
 nombre: string;
 };
 };
}

export interface HistorialPagosResponse {
 pagos: PagoHistorial[];
 totalCobros: number;
 totalPagos: number;
 neto: number;
 meta: {
 total: number;
 page: number;
 limit: number;
 totalPages: number;
 };
}

// ── Resumen cartera (dashboard) ────────────────────────────────────────────

export interface ResumenCartera {
 cxc: { total: number; porVencer: number; vencida: number; cantidadFacturas: number };
 cxp: { total: number; porVencer: number; vencida: number; cantidadFacturas: number };
}

// ── CuentaBancaria ─────────────────────────────────────────────────────────

export interface CuentaBancaria {
 activa: boolean;
 banco: {
 id: string;
 nombre: string;
 codigo: string | null;
 nit: string;
 };
 codigoCuentaContable: string;
 createdAt: string;
 id: string;
 nombre: string;
 numeroCuenta: string;
 observaciones: string | null;
 saldoActual: number;
 saldoInicial: number;
 tipoCuenta: string;
 updatedAt: string;
}

// ── DTOs de formulario ────────────────────────────────────────────────────

export interface RegistrarCobroDto {
 monto: number;
 fecha: string;
 medioPago: MedioPago;
 cuentaBancariaId?: number;
 referencia?: string;
 notas?: string;
}

export type RegistrarPagoDto = RegistrarCobroDto;

export interface ReporteAgingFlat {
 items: Array<{
 id: string;
 fecha: string;
 vencimiento: string | null;
 numeroFactura: string;
 contraparte: string;
 numeroContraparte: string;
 saldo: number;
 diasVencidos: number;
 estado: string;
 }>;
 totales: {
 total: number;
 porVencer: number;
 vencido: number;
 };
 generadoEn: string;
}


export interface ReporteAgingFlatAgrupado {
 items: Array<{
 identificacion: string;
 sucursal: string;
 nombre: string;
 deuda: number;
 saldoFavor: number;
 saldoCartera: number; 
 facturas: Array<{
 id: string;
 fecha: string;
 vencimiento: string | null;
 numeroFactura: string;
 saldo: number;
 diasVencidos: number;
 estado: string;
 }>;
 }>;
 totales: {
 totalDeuda: number;
 totalSaldoFavor: number;
 totalCartera: number;
 };
 generadoEn: string;
 meta?: {
 total: number;
 page: number;
 limit: number;
 totalPages: number;
 };
}

// ── Movimientos (listado global de cobros y pagos) ─────────────────────────

export interface MovimientoItem {
 id: string;
 numero: string;
 tipo: TipoPago;
 fecha: string;
 monto: number;
 medioPago: MedioPago;
 referencia: string | null;
 notas: string | null;
 asientoId: string | null;
 numeroFactura: string;
 facturaId: string | null;
 contraparteId: string | null;
 contraparteNombre: string;
 cuentaBancaria: {
 id: string;
 nombre: string;
 numeroCuenta: string;
 banco: { id: string; nombre: string } | null;
 } | null;
 creadoPor: string;
 createdAt: string;
 estado?: 'activo' | 'anulado';
 motivoAnulacion?: string | null;
}

export interface MovimientosResponse {
 items: MovimientoItem[];
 resumen: {
 totalCobros: number;
 totalPagos: number;
 neto: number;
 };
 meta: {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
 };
}

export interface MovimientosFiltros {
 tipo?: TipoPago | string;
 fechaInicio?: string;
 fechaFin?: string;
 medioPago?: MedioPago;
 clienteId?: string;
 proveedorId?: string;
 busqueda?: string;
 page?: number;
 limit?: number;
}

// ── Asiento contable de un pago ────────────────────────────────────────────

export interface AsientoPagoResponse {
 pago: {
 id: string;
 numero: string;
 tipo: TipoPago;
 fecha: string;
 monto: number;
 medioPago: MedioPago;
 referencia: string | null;
 numeroFactura: string;
 };
 asiento: {
 id: string;
 numero: string;
 fecha: string;
 tipo: string;
 referencia: string | null;
 descripcion: string | null;
 totalDebito: number;
 totalCredito: number;
 } | null;
 detalles: Array<{
 id: string;
 cuentaCodigo: string;
 cuentaNombre: string;
 debito: number;
 credito: number;
 descripcion: string | null;
 }>;
}

// ── Resumen Financiero (Dashboard unificado) ───────────────────────────────

export interface ResumenFinancieroResponse {
 cxc: {
 totalPendiente: number;
 totalVencido: number;
 totalPorVencer: number;
 totalFacturas: number;
 };
 cxp: {
 totalPendiente: number;
 totalVencido: number;
 totalPorVencer: number;
 totalFacturas: number;
 };
 posicionNeta: number;
 ultimosMovimientos: Array<{
 id: string;
 numero: string;
 tipo: TipoPago;
 fecha: string;
 monto: number;
 numeroFactura: string;
 contraparteNombre: string;
 }>;
 proximosVencimientos: Array<{
 facturaId: string;
 numeroFactura: string;
 clienteNombre: string;
 saldoPendiente: number;
 fechaVencimiento: string;
 }>;
}

// ── Estado de Cuenta por Cliente ───────────────────────────────────────────

export interface EstadoCuentaClienteResponse {
 clienteId: string;
 resumen: {
 totalFacturado: number;
 totalPagado: number;
 saldoPendiente: number;
 totalFacturas: number;
 totalCobros: number;
 };
 facturas: Array<{
 facturaId: string;
 numeroFactura: string;
 fecha: string;
 fechaVencimiento: string | null;
 total: number;
 totalPagado: number;
 saldoPendiente: number;
 paymentStatus: PaymentStatus;
 }>;
 movimientos: Array<{
 id: string;
 fecha: string;
 monto: number;
 medioPago: MedioPago;
 numeroFactura: string;
 referencia: string | null;
 cuentaBancaria: {
 nombre: string;
 banco: string | null;
 } | null;
 }>;
}

// ── Estado de Cuenta por Proveedor ─────────────────────────────────────────

export interface EstadoCuentaProveedorResponse {
 proveedorId: string;
 resumen: {
 totalFacturado: number;
 totalPagado: number;
 saldoPendiente: number;
 totalFacturas: number;
 totalPagos: number;
 };
 facturas: Array<{
 facturaId: string;
 numeroFactura: string;
 fecha: string;
 fechaVencimiento: string | null;
 total: number;
 totalPagado: number;
 saldoPendiente: number;
 paymentStatus: PaymentStatus;
 }>;
 movimientos: Array<{
 id: string;
 fecha: string;
 monto: number;
 medioPago: MedioPago;
 numeroFactura: string;
 referencia: string | null;
 cuentaBancaria: {
 nombre: string;
 banco: string | null;
 } | null;
 }>;
}
