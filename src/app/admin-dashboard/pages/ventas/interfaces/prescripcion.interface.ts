export type TipoLentePrescripcion = 'OFTALMICO' | 'CONTACTO' | 'OTRO';
export type PrescripcionEstado = 'ACTIVA' | 'ANULADA';

export interface MedicionOcular {
  esfera?: number | null;
  cilindro?: number | null;
  eje?: number | null;
  adicion?: number | null;
  prisma?: string;
  agudezaLejana?: string;
  agudezaProxima?: string;
  observaciones?: string;
  [key: string]: unknown;
}

export interface Prescripcion {
  id: string;
  numero: string;
  fechaExamen: string;
  clienteId: string;
  cliente?: any;
  profesionalId?: string | null;
  profesional?: any;
  tipoExamen: string;
  tipoLente: TipoLentePrescripcion;
  ojoDerecho: MedicionOcular;
  ojoIzquierdo: MedicionOcular;
  lensometria: { derecho?: MedicionOcular; izquierdo?: MedicionOcular };
  datosContacto?: Record<string, unknown>;
  usoIndicado?: string | null;
  material?: string | null;
  filtroTratamiento?: string | null;
  tipoLenteDescripcion?: string | null;
  fechaControl?: string | null;
  indicaciones?: string | null;
  observaciones?: string | null;
  recomendaciones?: string | null;
  estado: PrescripcionEstado;
}

export interface PrescripcionesResponse {
  success: boolean;
  data: Prescripcion[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
