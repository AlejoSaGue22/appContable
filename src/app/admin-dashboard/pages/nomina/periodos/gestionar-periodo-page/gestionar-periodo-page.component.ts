import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NominaService } from '../../services/nomina.service';
import { PeriodoNomina, Empleado, PeriodoEmpleado } from '../../interfaces/nomina.interface';
import { ConceptoPeriodoPopoverComponent } from '../components/concepto-periodo-popover/concepto-periodo-popover.component';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
  selector: 'app-gestionar-periodo-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    RouterLink,
    ConceptoPeriodoPopoverComponent,
    HeaderTitlePageComponent,
  ],
  templateUrl: './gestionar-periodo-page.component.html',
})
export default class GestionarPeriodoPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nominaService = inject(NominaService);
  private notification = inject(NotificationService);
  private loader = inject(LoaderService);

  periodo = signal<PeriodoNomina | null>(null);
  allEmpleados = signal<Empleado[]>([]);
  assignedEmpleados = signal<PeriodoEmpleado[]>([]);
  selectedIds = signal<Set<string>>(new Set());
  searchQuery = signal('');
  loading = signal(true);

  // Popover state
  showPopover = signal(false);
  popoverEmpleado = signal<Empleado | null>(null);
  popoverTipo = signal<'DEVENGADO' | 'DEDUCCION'>('DEVENGADO');

  headTitle = computed(() => {
    const p = this.periodo();
    return {
      title: p ? `Gestionar Período: ${p.nombre}` : 'Gestionar Período',
      slog: p ? `Fechas: ${p.fechaInicio} al ${p.fechaFin} · Estado: ${p.estado}` : 'Detalle de liquidación de nómina',
    };
  });

  totalDevengadoEstimado = computed(() =>
    this.assignedEmpleados().reduce((sum, item: any) => sum + Number(item.totalDevengado || 0), 0)
  );

  totalDeduccionesEstimado = computed(() =>
    this.assignedEmpleados().reduce((sum, item: any) => sum + Number(item.totalDeducciones || 0), 0)
  );

  totalNetoEstimado = computed(() =>
    this.assignedEmpleados().reduce((sum, item: any) => sum + Number(item.netoPagar || 0), 0)
  );

  assignedMap = computed(() => {
    const map = new Map<string, any>();
    for (const item of this.assignedEmpleados()) {
      map.set(item.empleadoId, item);
    }
    return map;
  });

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
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.notification.error('Identificador del período no especificado');
      this.router.navigate(['/panel/nomina/periodos']);
      return;
    }

    try {
      const p = await this.nominaService.getPeriodo(id).toPromise();
      this.periodo.set(p || null);

      if (p) {
        const [empRes, assigned] = await Promise.all([
          this.nominaService.getEmpleados({ limit: 1000, activo: true }).toPromise(),
          this.nominaService.getEmpleadosOfPeriodo(p.id).toPromise(),
        ]);

        const emps = empRes?.data || [];
        const currentAssigned = assigned || [];
        this.allEmpleados.set(emps);
        this.assignedEmpleados.set(currentAssigned);

        const initSet = new Set<string>(currentAssigned.map((pe) => pe.empleadoId));
        this.selectedIds.set(initSet);
      }
    } catch (err: any) {
      this.notification.error('Error al cargar datos del período', err?.message);
    } finally {
      this.loading.set(false);
    }
  }

  toggleSelect(id: string) {
    const p = this.periodo();
    if (p && p.estado !== 'BORRADOR') {
      this.notification.warning('No se pueden modificar empleados de un período ya liquidado');
      return;
    }

    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  toggleSelectAll() {
    const p = this.periodo();
    if (p && p.estado !== 'BORRADOR') {
      this.notification.warning('No se pueden modificar empleados de un período ya liquidado');
      return;
    }

    const list = this.filteredEmpleados();
    const current = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      list.forEach((e) => current.delete(e.id));
    } else {
      list.forEach((e) => current.add(e.id));
    }
    this.selectedIds.set(current);
  }

  openPopover(emp: Empleado, tipo: 'DEVENGADO' | 'DEDUCCION') {
    const p = this.periodo();
    if (p && p.estado !== 'BORRADOR') {
      this.notification.warning('Solo se pueden agregar ingresos o deducciones a períodos en estado Borrador');
      return;
    }
    this.popoverEmpleado.set(emp);
    this.popoverTipo.set(tipo);
    this.showPopover.set(true);
  }

  onPopoverUpdated() {
    this.loadData();
  }

  async guardarAsignacion() {
    const p = this.periodo();
    if (!p) return;
    if (p.estado !== 'BORRADOR') {
      this.notification.warning('No se pueden guardar cambios en un período ya liquidado o cerrado');
      return;
    }

    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) {
      this.notification.error('Debe seleccionar al menos un empleado para el período');
      return;
    }

    this.loader.show();
    try {
      await this.nominaService.assignEmpleadosToPeriodo(p.id, ids).toPromise();
      this.notification.success('Empleados y novedades asignadas correctamente');
      this.loadData();
    } catch (err: any) {
      this.notification.error('Error al guardar asignación', err?.message);
    } finally {
      this.loader.hide();
    }
  }

  async liquidarPeriodo() {
    const p = this.periodo();
    if (!p) return;

    this.loader.show();
    try {
      await this.nominaService.liquidarPeriodo(p.id, { empleados: [] }).toPromise();
      this.notification.success('Nómina liquidada exitosamente con snapshot congelado');
      this.router.navigate(['/panel/nomina/periodos']);
    } catch (err: any) {
      this.notification.error('Error al liquidar nómina', err?.message);
    } finally {
      this.loader.hide();
    }
  }
}
