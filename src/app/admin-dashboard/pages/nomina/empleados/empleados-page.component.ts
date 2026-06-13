import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NominaService } from '../services/nomina.service';
import { Empleado } from '../interfaces/nomina.interface';
import { EmpleadoTableComponent } from './components/empleado-table/empleado-table.component';
import { EmpleadoFormModalComponent } from './components/empleado-form-modal/empleado-form-modal.component';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';
import { NotificationService } from '@shared/services/notification.service';

@Component({
    selector: 'app-empleados-page',
    standalone: true,
    imports: [CommonModule, EmpleadoTableComponent, EmpleadoFormModalComponent, HeaderTitlePageComponent],
    template: `
    <div class="p-6 space-y-6">
      <header-title-page [titleHead]="{ title: 'Empleados', slog: 'Gestión de empleados para nómina' }">
      </header-title-page>

      <div class="flex justify-end">
        <button (click)="openCreate()" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
          + Nuevo Empleado
        </button>
      </div>

      <app-empleado-table [empleados]="empleados()" (edit)="openEdit($event)" (delete)="confirmDelete($event)" />

      @if (showModal()) {
        <app-empleado-form-modal [empleado]="selectedEmpleado()" (close)="closeModal()" (saved)="onSaved()" />
      }
    </div>
  `
})
export default class EmpleadosPageComponent {
    private nominaService = inject(NominaService);
    private loader = inject(LoaderService);
    private notification = inject(NotificationService);

    empleados = signal<Empleado[]>([]);
    showModal = signal(false);
    selectedEmpleado = signal<Empleado | null>(null);

    constructor() {
        this.loadEmpleados();
    }

    loadEmpleados() {
        this.loader.show();
        this.nominaService.getEmpleados({ limit: 1000 }).subscribe({
            next: (res) => this.empleados.set(res.data),
            error: (err) => this.notification.error('Error al cargar empleados', err),
            complete: () => this.loader.hide(),
        });
    }

    openCreate() {
        this.selectedEmpleado.set(null);
        this.showModal.set(true);
    }

    openEdit(emp: Empleado) {
        this.selectedEmpleado.set(emp);
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.selectedEmpleado.set(null);
    }

    onSaved() {
        this.closeModal();
        this.loadEmpleados();
    }

    confirmDelete(id: string) {
        if (!confirm('¿Eliminar este empleado?')) return;
        this.nominaService.deleteEmpleado(id).subscribe({
            next: () => this.loadEmpleados(),
            error: (err) => this.notification.error('Error al eliminar', err),
        });
    }
}
