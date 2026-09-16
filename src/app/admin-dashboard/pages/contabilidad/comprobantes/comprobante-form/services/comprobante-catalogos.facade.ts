import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, map, Observable, tap } from 'rxjs';
import { TipoComprobanteService } from '../../../../administracion/configuraciones/pages/tipo-comprobantes/services/tipo-comprobante.service';
import { CuentasContablesService } from '../../../services/cuentas-contables.service';
import { ClientesService } from '../../../../ventas/services/clientes.service';
import { ProveedoresService } from '../../../../compras/services/proveedores.service';
import { CentrosCostosService } from '../../../../administracion/configuraciones/pages/centros-costos/services/centros-costos.service';
import { NominaService } from '../../../../nomina/services/nomina.service';
import { GetCuentasContables } from '../../../interfaces/cuentas-contables.interface';
import { TipoComprobanteInterface } from '../../../../administracion/configuraciones/pages/tipo-comprobantes/interfaces/tipo-comprobante.interface';
import { CentroCostoSelect, TerceroSelect } from '../interfaces/comprobante-form.interface';

@Injectable()
export class ComprobanteCatalogosFacade {
  private readonly tipoService = inject(TipoComprobanteService);
  private readonly cuentasService = inject(CuentasContablesService);
  private readonly clientesService = inject(ClientesService);
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly centrosCostosService = inject(CentrosCostosService);
  private readonly nominaService = inject(NominaService);

  readonly tiposComprobantes = signal<TipoComprobanteInterface[]>([]);
  readonly cuentasContables = signal<GetCuentasContables[]>([]);
  readonly terceros = signal<TerceroSelect[]>([]);
  readonly centrosCostos = signal<CentroCostoSelect[]>([]);

  cargar(): Observable<void> {
    return forkJoin({
      tipos: this.tipoService.loadTipos(),
      cuentas: this.cuentasService.getCuentasContables(),
      clientes: this.clientesService.getClientes({ limit: 1000, offset: 0 }),
      proveedores: this.proveedoresService.getProveedores({ limit: 1000, offset: 0 }),
      entidades: this.nominaService.getEntidadesSeguridad(),
      empleados: this.nominaService.getEmpleados({ limit: 1000, offset: 0 }),
      centros: this.centrosCostosService.loadCentrosCostos(),
    }).pipe(
      tap(({ tipos, cuentas, clientes, proveedores, entidades, empleados, centros }) => {
        this.tiposComprobantes.set(tipos.filter((tipo) => tipo.activo));
        this.cuentasContables.set(cuentas.filter((cuenta) => cuenta.aceptaMovimiento && cuenta.isActive));
        this.terceros.set([
          ...(clientes.clientes || []).map((cliente): TerceroSelect => ({
            id: cliente.id,
            nombreDisplay: `${cliente.razonSocial?.trim() ? cliente.razonSocial : `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim()} (Cliente)`,
            tipo: 'CLIENTE',
          })),
          ...(proveedores.proveedores || []).map((proveedor): TerceroSelect => ({
            id: proveedor.id,
            nombreDisplay: `${proveedor.razonSocial?.trim() ? proveedor.razonSocial : `${proveedor.nombre || ''} ${proveedor.apellido || ''}`.trim()} (Proveedor)`,
            tipo: 'PROVEEDOR',
          })),
          ...(empleados.data || []).map((empleado): TerceroSelect => ({
            id: empleado.id,
            nombreDisplay: `${empleado.primerNombre} ${empleado.primerApellido} - ${empleado.numeroDocumento} (Empleado)`,
            tipo: 'EMPLEADO',
          })),
          ...(entidades || []).map((entidad): TerceroSelect => ({
            id: entidad.id,
            nombreDisplay: `${entidad.nombre} (${entidad.tipo})`,
            tipo: 'SEGURIDAD_SOCIAL',
          })),
        ]);
        this.centrosCostos.set((centros || []).filter((centro) => centro.activo));
      }),
      map(() => undefined),
    );
  }
}
