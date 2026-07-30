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

@Component({
  selector: 'app-empleados-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    EmpleadoTableComponent,
    HeaderTitlePageComponent,
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

  constructor() {
    this.loadCargos();

    // Reload employees when filters or pagination page changes
    effect(() => {
      this.loadEmpleados();
    });
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
          this.paginationService.pageSize.set(res.pages);
        },
        error: (err) =>
          this.notification.error(err.message, 'Error al cargar empleados'),
        complete: () => this.loader.hide(),
      });
  }

  onFilterChange(newFilters: any) {
    this.filters.set(newFilters);
    this.router.navigate([], { queryParams: { page: 1 }, queryParamsHandling: 'merge' });
  }

  confirmDelete(id: string) {
    if (
      !confirm(
        '¿Está seguro de eliminar este empleado? Esta acción no se puede deshacer.',
      )
    )
      return;
    this.nominaService.deleteEmpleado(id).subscribe({
      next: () => {
        this.notification.success('Empleado eliminado');
        this.loadEmpleados();
      },
      error: (err) => this.notification.error('Error al eliminar', err),
    });
  }
}
