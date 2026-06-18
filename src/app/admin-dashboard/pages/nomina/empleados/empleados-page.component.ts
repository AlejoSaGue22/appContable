import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NominaService } from '../services/nomina.service';
import { Empleado } from '../interfaces/nomina.interface';
import { EmpleadoTableComponent } from './components/empleado-table/empleado-table.component';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';
import { NotificationService } from '@shared/services/notification.service';

@Component({
    selector: 'app-empleados-page',
    standalone: true,
    imports: [CommonModule, RouterLink, EmpleadoTableComponent, HeaderTitlePageComponent],
    template: `
    <div class="p-6 space-y-6">
      <header-title-page [titleHead]="{ title: 'Empleados', slog: 'Gestión de empleados para nómina' }">
      </header-title-page>

      <div class="flex justify-end">
        <a routerLink="/panel/nomina/empleados/crear"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 active:scale-[0.98]">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Empleado
        </a>
      </div>

      <app-empleado-table [empleados]="empleados()" (delete)="confirmDelete($event)" />
    </div>
    `
})
export default class EmpleadosPageComponent {
    private nominaService = inject(NominaService);
    private loader = inject(LoaderService);
    private notification = inject(NotificationService);

    empleados = signal<Empleado[]>([]);

    constructor() {
        this.loadEmpleados();
    }

    loadEmpleados() {
        this.loader.show();
        this.nominaService.getEmpleados({ limit: 1000 }).subscribe({
            next: (res) => this.empleados.set(res.data),
            error: (err) => this.notification.error(err.message, 'Error al cargar empleados'),
            complete: () => this.loader.hide(),
        });
    }

    confirmDelete(id: string) {
        if (!confirm('¿Está seguro de eliminar este empleado? Esta acción no se puede deshacer.')) return;
        this.nominaService.deleteEmpleado(id).subscribe({
            next: () => {
                this.notification.success('Empleado eliminado');
                this.loadEmpleados();
            },
            error: (err) => this.notification.error('Error al eliminar', err),
        });
    }
}
