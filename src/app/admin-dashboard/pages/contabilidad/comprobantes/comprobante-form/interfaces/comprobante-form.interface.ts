import { TipoComprobanteInterface } from '../../../../administracion/configuraciones/pages/tipo-comprobantes/interfaces/tipo-comprobante.interface';
import { Empleado } from '../../../../nomina/interfaces/nomina.interface';

export type TipoTercero = 'CLIENTE' | 'PROVEEDOR' | 'EMPLEADO' | 'SEGURIDAD_SOCIAL';

export interface TerceroSelect {
  id: string;
  nombreDisplay: string;
  tipo: TipoTercero;
}

export interface CentroCostoSelect {
  id: string;
  codigo: string;
  nombre: string;
  activo?: boolean;
}

export interface ComprobanteCatalogos {
  tiposComprobantes: TipoComprobanteInterface[];
  cuentasContables: import('../../../interfaces/cuentas-contables.interface').GetCuentasContables[];
  terceros: TerceroSelect[];
  centrosCostos: CentroCostoSelect[];
}

export type EmpleadoSelect = Pick<Empleado, 'id' | 'primerNombre' | 'primerApellido' | 'numeroDocumento'>;
