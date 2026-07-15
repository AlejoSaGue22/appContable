import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

import { ActivosFijosService } from '../services/activos-fijos.service';
import { CuentasContablesService } from '../services/cuentas-contables.service';
import { ProveedoresService } from '../../compras/services/proveedores.service';
import { CentrosCostosService } from '../../administracion/configuraciones/pages/centros-costos/services/centros-costos.service';

import { LoaderComponent } from '@utils/components/loader/loader.component';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

import { ActivoFijo, DepreciacionActivoFijo } from '../interfaces/activos-fijos.interface';
import { GetCuentasContables } from '../interfaces/cuentas-contables.interface';

@Component({
  selector: 'app-activos-fijos',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    CurrencyPipe,
    HeaderTitlePageComponent,
    ModalComponent,
    FormsModule,
  ],
  templateUrl: './activos-fijos.component.html',
})
export class ActivosFijosComponent {
  private router = inject(Router);
  private activosService = inject(ActivosFijosService);
  private cuentasService = inject(CuentasContablesService);
  private proveedoresService = inject(ProveedoresService);
  private centrosCostosService = inject(CentrosCostosService);
  private notificationService = inject(NotificationService);
  private loaderService = inject(LoaderService);

  headTitle: HeaderInput = {
    title: 'Activos Fijos',
    slog: 'Registro, depreciación acumulada y control de bienes y equipos',
  };

  // --- Signals & Modals ---
  isDepreciarModalOpen = signal(false);
  isRetirarModalOpen = signal(false);
  isDetailsModalOpen = signal(false);

  selectedAsset = signal<ActivoFijo | null>(null);
  depreciaciones = signal<DepreciacionActivoFijo[]>([]);

  // --- Form Objects ---
  depreciarForm = {
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
  };

  retirarForm = {
    fecha: new Date().toISOString().substring(0, 10),
    motivo: '',
    valorVenta: 0,
    cuentaBancoCajaId: '',
    cuentaIngresoRetiroId: '',
    cuentaPerdidaRetiroId: '',
  };

  // --- Catalog lists ---
  cuentasList = signal<GetCuentasContables[]>([]);
  proveedoresList = signal<any[]>([]);
  centrosCostosList = signal<any[]>([]);

  constructor() {
    this.cargarCatalogos();
  }

  // --- Resources ---
  activosResource = rxResource({
    request: () => ({}),
    loader: () => this.activosService.getActivosFijos()
  });

  activos = computed(() => this.activosResource.value() ?? []);

  // --- Load Catalogs ---
  cargarCatalogos() {
    this.cuentasService.getCuentasContables().subscribe({
      next: (cuentas) => {
        // Filtrar solo las que aceptan movimientos
        this.cuentasList.set(cuentas.filter((c) => c.aceptaMovimiento));
      }
    });

    this.proveedoresService.getProveedores({ limit: 100, offset: 0 }).subscribe({
      next: (res) => {
        this.proveedoresList.set(res.proveedores || []);
      }
    });

    this.centrosCostosService.loadCentrosCostos().subscribe({
      next: (centros) => {
        this.centrosCostosList.set(centros || []);
      }
    });
  }

  // --- Account categories helpers ---
  get cuentasActivo() {
    return this.cuentasList().filter(c => c.tipo === 'ACTIVO');
  }

  get cuentasGasto() {
    return this.cuentasList().filter(c => c.tipo === 'GASTO');
  }

  get cuentasBancoCaja() {
    // Cuentas de banco o caja suelen empezar por 11 (Caja, Bancos)
    return this.cuentasList().filter(c => c.tipo === 'ACTIVO' && (c.codigo.startsWith('1105') || c.codigo.startsWith('1110')));
  }

  // --- Navigation to Create/Edit ---
  navigateToCreate() {
    this.router.navigate(['/panel/contabilidad/activos-fijos/nuevo']);
  }

  navigateToEdit(activo: ActivoFijo) {
    this.router.navigate(['/panel/contabilidad/activos-fijos/editar', activo.id]);
  }

  // --- Run Depreciation Modal ---
  openDepreciarModal() {
    this.depreciarForm = {
      anio: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
    };
    this.isDepreciarModalOpen.set(true);
  }

  closeDepreciarModal() {
    this.isDepreciarModalOpen.set(false);
  }

  onSubmitDepreciar() {
    this.loaderService.show();
    this.activosService.depreciarPeriodo(this.depreciarForm).subscribe({
      next: (res) => {
        this.notificationService.success(
          `Depreciación mensual procesada correctamente. Se procesaron ${res.procesados} activo(s).`
        );
        this.isDepreciarModalOpen.set(false);
        this.activosResource.reload();
      },
      error: (err) => {
        this.loaderService.hide();
        this.notificationService.error(
          err.error?.message || 'Error al procesar la depreciación',
          'Error'
        );
      },
      complete: () => {
        this.loaderService.hide();
      }
    });
  }

  // --- View Details & History Modal ---
  openDetailsModal(activo: ActivoFijo) {
    this.selectedAsset.set(activo);
    this.depreciaciones.set([]);
    this.isDetailsModalOpen.set(true);

    this.activosService.getDepreciaciones(activo.id).subscribe({
      next: (logs) => {
        this.depreciaciones.set(logs);
      }
    });
  }

  closeDetailsModal() {
    this.isDetailsModalOpen.set(false);
  }

  // --- Disposal/Retire Modal ---
  openRetirarModal(activo: ActivoFijo) {
    this.selectedAsset.set(activo);
    this.retirarForm = {
      fecha: new Date().toISOString().substring(0, 10),
      motivo: '',
      valorVenta: 0,
      cuentaBancoCajaId: '',
      cuentaIngresoRetiroId: '',
      cuentaPerdidaRetiroId: '',
    };
    this.isRetirarModalOpen.set(true);
  }

  closeRetirarModal() {
    this.isRetirarModalOpen.set(false);
  }

  onSubmitRetirar() {
    const asset = this.selectedAsset();
    if (!asset) return;

    this.loaderService.show();
    this.activosService.retirarActivo(asset.id, this.retirarForm).subscribe({
      next: () => {
        this.notificationService.success('Activo fijo retirado correctamente del sistema contable.');
        this.isRetirarModalOpen.set(false);
        this.activosResource.reload();
      },
      error: (err) => {
        this.loaderService.hide();
        this.notificationService.error(
          err.error?.message || 'Error al retirar el activo fijo',
          'Error'
        );
      },
      complete: () => {
        this.loaderService.hide();
      }
    });
  }
}
