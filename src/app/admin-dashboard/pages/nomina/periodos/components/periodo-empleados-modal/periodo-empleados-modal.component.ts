import { Component, Input, OnInit, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NominaService } from '../../../services/nomina.service';
import { PeriodoNomina, Empleado, PeriodoEmpleado } from '../../../interfaces/nomina.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
  selector: 'app-periodo-empleados-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './periodo-empleados-modal.component.html',
})
export class PeriodoEmpleadosModalComponent implements OnInit {
  @Input({ required: true }) periodo!: PeriodoNomina;

  close = output<void>();
  saved = output<void>();

  private nominaService = inject(NominaService);
  private notification = inject(NotificationService);
  private loader = inject(LoaderService);

  allEmpleados = signal<Empleado[]>([]);
  assignedEmpleados = signal<PeriodoEmpleado[]>([]);
  selectedIds = signal<Set<string>>(new Set());
  searchQuery = signal('');
  loading = signal(true);

  filteredEmpleados = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return this.allEmpleados().filter((e) => {
      const nombre = `${e.primerNombre} ${e.segundoNombre || ''} ${e.primerApellido} ${e.segundoApellido || ''}`.toLowerCase();
      const doc = (e.numeroDocumento || '').toLowerCase();
      const cargo = (e.cargo?.nombre || '').toLowerCase();
      return !q || nombre.includes(q) || doc.includes(q) || cargo.includes(q);
    });
  });

  isAllSelected = computed(() => {
    const list = this.filteredEmpleados();
    if (list.length === 0) return false;
    const sel = this.selectedIds();
    return list.every((e) => sel.has(e.id));
  });

  selectedCount = computed(() => this.selectedIds().size);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const [empRes, assigned] = await Promise.all([
        this.nominaService.getEmpleados({ limit: 1000, activo: true }).toPromise(),
        this.nominaService.getEmpleadosOfPeriodo(this.periodo.id).toPromise(),
      ]);

      const emps = empRes?.data || [];
      const currentAssigned = assigned || [];
      this.allEmpleados.set(emps);
      this.assignedEmpleados.set(currentAssigned);

      const initSet = new Set<string>(currentAssigned.map((pe) => pe.empleadoId));
      this.selectedIds.set(initSet);
    } catch (err: any) {
      this.notification.error('Error al cargar empleados', err?.message);
    } finally {
      this.loading.set(false);
    }
  }

  toggleSelect(id: string) {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  toggleSelectAll() {
    const list = this.filteredEmpleados();
    const current = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      list.forEach((e) => current.delete(e.id));
    } else {
      list.forEach((e) => current.add(e.id));
    }
    this.selectedIds.set(current);
  }

  async guardarAsignacion() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) {
      this.notification.error('Debe seleccionar al menos un empleado para el período');
      return;
    }

    this.loader.show();
    try {
      await this.nominaService.assignEmpleadosToPeriodo(this.periodo.id, ids).toPromise();
      this.notification.success('Empleados asignados exitosamente al período');
      this.saved.emit();
      this.close.emit();
    } catch (err: any) {
      this.notification.error('Error al asignar empleados', err?.message);
    } finally {
      this.loader.hide();
    }
  }
}
