// src/app/pagos/models/pagos.models.ts

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type MedioPago     = 'caja' | 'banco' | 'transferencia' | 'cheque';
export type TipoPago      = 'cobro' | 'pago';

// ── CxC ────────────────────────────────────────────────────────────────────

export interface CxcItem {
  facturaId:        string;
  numeroFactura:    string;
  clienteId:        string;
  clienteNombre:    string;
  fechaEmision:     string;
  fechaVencimiento: string | null;
  diasVencida:      number;
  total:            number;
  totalPagado:      number;
  saldoPendiente:   number;
  paymentStatus:    PaymentStatus;
  agingBucket:      AgingBucket;
}

export interface CxcResumen {
  totalCartera:      number;
  porVencer:         number;
  vencida:           number;
  cantidadPorVencer: number;
  cantidadVencida:   number;
}

export interface CxcResponse {
  items:   CxcItem[];
  resumen: CxcResumen;
}

// ── CxP ────────────────────────────────────────────────────────────────────

export interface CxpItem {
  facturaId:        string;
  numeroFactura:    string;
  proveedorId:      string;
  proveedorNombre:  string;
  fechaEmision:     string;
  fechaVencimiento: string | null;
  diasVencida:      number;
  total:            number;
  totalPagado:      number;
  saldoPendiente:   number;
  paymentStatus:    PaymentStatus;
  agingBucket:      AgingBucket;
}

export interface CxpResumen {
  totalPorPagar:     number;
  porVencer:         number;
  vencida:           number;
  cantidadPorVencer: number;
  cantidadVencida:   number;
}

export interface CxpResponse {
  items:   CxpItem[];
  resumen: CxpResumen;
}

// ── Aging ──────────────────────────────────────────────────────────────────

export type AgingBucket = 'porVencer' | 'de1a30' | 'de31a60' | 'de61a90' | 'mas90';

export interface AgingRow {
  id:            string;
  numero:        string;
  contraparte:   string;
  emision:       string;
  vencimiento:   string | null;
  diasVencida:   number;
  total:         number;
  pagado:        number;
  saldo:         number;
  paymentStatus: PaymentStatus;
  bucket:        AgingBucket;
}

export interface AgingGroup {
  contraparteId:     string;
  contraparteNombre: string;
  porVencer:         number;
  de1a30:            number;
  de31a60:           number;
  de61a90:           number;
  mas90:             number;
  total:             number;
  facturas:          AgingRow[];
}

export interface AgingReporte {
  grupos: AgingGroup[];
  totales: {
    porVencer: number;
    de1a30:    number;
    de31a60:   number;
    de61a90:   number;
    mas90:     number;
    total:     number;
  };
  generadoEn: string;
}

// ── Pagos / Historial ──────────────────────────────────────────────────────

export interface PagoHistorial {
  id:              string;
  tipo:            TipoPago;
  fecha:           string;
  monto:           number;
  medioPago:       MedioPago;
  referencia:      string | null;
  numeroDocumento: string;
  contraparte:     string;
  asientoId:       number | null;
}

export interface HistorialPagosResponse {
  pagos:       PagoHistorial[];
  totalCobros: number;
  totalPagos:  number;
  neto:        number;
}

// ── Resumen cartera (dashboard) ────────────────────────────────────────────

export interface ResumenCartera {
  cxc: { total: number; porVencer: number; vencida: number; cantidadFacturas: number };
  cxp: { total: number; porVencer: number; vencida: number; cantidadFacturas: number };
}

// ── CuentaBancaria ─────────────────────────────────────────────────────────

export interface CuentaBancaria {
  id:         number;
  nombre:     string;
  banco:      string;
  tipoCuenta: 'corriente' | 'ahorro';
}

// ── DTOs de formulario ────────────────────────────────────────────────────

export interface RegistrarCobroDto {
  monto:             number;
  fecha:             string;
  medioPago:         MedioPago;
  cuentaBancariaId?: number;
  referencia?:       string;
  notas?:            string;
}

export type RegistrarPagoDto = RegistrarCobroDto;