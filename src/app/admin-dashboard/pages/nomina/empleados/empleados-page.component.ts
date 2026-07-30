import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NominaService } from '../services/nomina.service';
import { Empleado, Cargo } from '../interfaces/nomina.interface';
import { EmpleadoTableComponent } from './components/empleado-table/empleado-table.component';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';
import { NotificationService } from '@shared/services/notification.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '@shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-empleados-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    EmpleadoTableComponent,
    HeaderTitlePageComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './empleados-page.component.html',
})
export default class EmpleadosPageComponent {
  private nominaService = inject(NominaService);
  private loader = inject(LoaderService);
  private notification = inject(NotificationService);
  private paginationService = inject(PaginationService);
  private router = inject(Router);

  empleados = signal<Empleado[]>([]);
  cargos = signal<Cargo[]>([]);
  filters = signal<any>({});

  // Modal de confirmación
  confirmModal = signal<ConfirmModalConfig | null>(null);
  private confirmCallback: (() => void) | null = null;

  constructor() {
    this.loadCargos();

    // Reload employees when filters or pagination page changes
    effect(() => {
      this.loadEmpleados();
    });
  }

  private pedirConfirmacion(config: ConfirmModalConfig, onConfirm: () => void) {
    this.confirmModal.set(config);
    this.confirmCallback = onConfirm;
  }

  onConfirmado() {
    this.confirmCallback?.();
    this.confirmModal.set(null);
    this.confirmCallback = null;
  }

  onCancelado() {
    this.confirmModal.set(null);
    this.confirmCallback = null;
  }

  loadCargos() {
    this.nominaService.getCargos().subscribe({
      next: (res) => this.cargos.set(res),
      error: (err) => console.error('Error al cargar cargos', err),
    });
  }

  loadEmpleados() {
    this.loader.show();
    this.nominaService
      .getEmpleados({
        limit: 10,
        offset: this.paginationService.currentPage(),
        ...this.filters(),
      })
      .subscribe({
        next: (res) => {
          this.empleados.set(res.data);
          this.paginationService.totalItems.set(res.count);
          this.pageSize.set(res.pages);
        },
        error: (err) =>
          this.notification.error(err.message, 'Error al cargar empleados'),
        complete: () => this.loader.hide(),
      });
  }

  private get pageSize() {
    return this.paginationService.pageSize;
  }

  onFilterChange(newFilters: any) {
    this.filters.set(newFilters);
    this.router.navigate([], { queryParams: { page: 1 }, queryParamsHandling: 'merge' });
  }

  confirmDelete(id: string) {
    const emp = this.empleados().find((e) => e.id === id);
    const nombre = emp ? `${emp.primerNombre} ${emp.primerApellido}`.trim() : 'este empleado';

    this.pedirConfirmacion(
      {
        title: 'Eliminar Empleado',
        message: `¿Está seguro de eliminar al empleado "${nombre}"?`,
        detail: 'Esta acción desactivará al empleado de la nómina.',
        icon: 'danger',
        confirmLabel: 'Sí, Eliminar',
        confirmClass: 'bg-red-600 hover:bg-red-700',
      },
      () => {
        this.loader.show();
        this.nominaService.deleteEmpleado(id).subscribe({
          next: () => {
            this.notification.success('Empleado eliminado exitosamente');
            this.loadEmpleados();
            this.loader.hide();
          },
          error: (err) => {
            this.notification.error(err?.message || err, 'Error al eliminar');
            this.loader.hide();
          },
        });
      }
    );
  }
}
