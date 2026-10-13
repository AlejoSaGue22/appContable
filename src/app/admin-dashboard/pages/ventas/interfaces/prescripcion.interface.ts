export type TipoLentePrescripcion = 'OFTALMICO' | 'CONTACTO' | 'OTRO';
export type PrescripcionEstado = 'ACTIVA' | 'ANULADA';

export interface TipoExamenPrescripcion {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  empresaId?: string | null;
}

export interface ProfesionalResponsable {
  id: string;
  nombre: string;
  especialidad?: string | null;
  registroProfesional?: string | null;
  firmaUrl?: string | null;
  activo: boolean;
  empresaId?: string | null;
}

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
  empresaId?: string | null;
  numero: string;
  fechaExamen: string;
  clienteId: string;
  cliente?: any;
  profesionalId?: string | null;
  profesional?: ProfesionalResponsable | null;
  tipoExamenId: string;
  tipoExamenRel?: TipoExamenPrescripcion;
  /** Código legado; el formulario debe usar tipoExamenId/tipoExamenRel. */
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
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    totalGeneral?: number;
    totalOftalmico?: number;
    totalContacto?: number;
  };
}
