export interface Impuesto {
  id?: string;
  nombre: string;
  tipo: string;
  tarifa: number;
  descripcion?: string;
  activo: boolean;
  isAcreditable: boolean;
  cuentaVentasId?: string;
  cuentaComprasId?: string;
  cuentaDevVentasId?: string;
  cuentaDevComprasId?: string;
  cuentaVentas?: any;
  cuentaCompras?: any;
  cuentaDevVentas?: any;
  cuentaDevCompras?: any;
}
