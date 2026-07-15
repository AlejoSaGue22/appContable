import { GetCuentasContables } from './cuentas-contables.interface';

export interface ActivoFijo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoActivo: string;
  fechaAdquisicion: string;
  valorAdquisicion: number;
  valorSalvamento: number;
  vidaUtilMeses: number;
  depreciacionAcumulada: number;
  valorLibros: number;
  estado: 'ACTIVO' | 'DEPRECIADO' | 'RETIRADO' | 'VENDIDO';
  cuentaActivoId: string;
  cuentaActivo?: GetCuentasContables;
  cuentaDepreciacionAcumuladaId: string;
  cuentaDepreciacionAcumulada?: GetCuentasContables;
  cuentaGastoDepreciacionId: string;
  cuentaGastoDepreciacion?: GetCuentasContables;
  proveedorId?: string;
  proveedor?: any;
  centroCostoId?: string;
  centroCosto?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DepreciacionActivoFijo {
  id: string;
  activoFijoId: string;
  activoFijo?: ActivoFijo;
  anio: number;
  mes: number;
  monto: number;
  asientoContableId: string;
  asientoContable?: any;
  createdAt: string;
}
