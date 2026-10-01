import { ComprobanteDetalleInterface } from '../../../interfaces/comprobantes.interface';
import { TerceroSelect } from '../interfaces/comprobante-form.interface';

export function terceroIdFromDetalle(detalle: ComprobanteDetalleInterface): string {
  return detalle.clienteId || detalle.proveedorId || detalle.empleadoId || detalle.entidadSSId || '';
}

export function mapTerceroToDetalle(tercero: TerceroSelect | undefined): Pick<ComprobanteDetalleInterface, 'clienteId' | 'proveedorId' | 'empleadoId' | 'entidadSSId'> {
  return {
    clienteId: tercero?.tipo === 'CLIENTE' ? tercero.id : undefined,
    proveedorId: tercero?.tipo === 'PROVEEDOR' ? tercero.id : undefined,
    empleadoId: tercero?.tipo === 'EMPLEADO' ? tercero.id : undefined,
    entidadSSId: tercero?.tipo === 'SEGURIDAD_SOCIAL' ? tercero.id : undefined,
  };
}
