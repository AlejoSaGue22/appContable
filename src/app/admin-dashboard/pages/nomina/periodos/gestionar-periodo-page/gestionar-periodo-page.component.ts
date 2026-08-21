import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NominaService } from '../../services/nomina.service';
import { PdfDesprendibleService } from '../../services/pdf-desprendible.service';
import { EmpresaService } from '@dashboard/services/empresa.service';
import { PeriodoNomina, Empleado, PeriodoEmpleado, Liquidacion } from '../../interfaces/nomina.interface';
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
  private pdfService = inject(PdfDesprendibleService);
  private empresaService = inject(EmpresaService);
  private notification = inject(NotificationService);
  private loader = inject(LoaderService);

  periodo = signal<PeriodoNomina | null>(null);
  allEmpleados = signal<Empleado[]>([]);
  assignedEmpleados = signal<PeriodoEmpleado[]>([]);
  selectedIds = signal<Set<string>>(new Set());
  searchQuery = signal('');
  loading = signal(true);
  empresa = signal<any>(null);

  // Popover state
  showPopover = signal(false);
  popoverEmpleado = signal<Empleado | null>(null);
  popoverTipo = signal<'DEVENGADO' | 'DEDUCCION'>('DEVENGADO');

  popoverDeduccionesLegales = computed(() => {
    const emp = this.popoverEmpleado();
    if (!emp) return null;
    const data = this.assignedMap().get(emp.id);
    if (!data) return null;
    return {
      salud: data.saludEmpleado || 0,
      pension: data.pensionEmpleado || 0,
      retefuente: data.retencionFuente || 0,
    };
  });

  headTitle = computed(() => {
    const p = this.periodo();
    return {
      title: p ? `Gestionar Período: ${p.nombre}` : 'Gestionar Período',
      slog: p ? `Fechas: ${p.fechaInicio} al ${p.fechaFin} · Estado: ${p.estado}` : 'Detalle de liquidación de nómina',
    };
  });

  totalDevengadoEstimado = computed(() => {
    let sum = 0;
    const map = this.displayMap();
    for (const id of this.selectedIds()) {
      if (map.has(id)) sum += Number(map.get(id).totalDevengado || 0);
    }
    return sum;
  });

  totalDeduccionesEstimado = computed(() => {
    let sum = 0;
    const map = this.displayMap();
    for (const id of this.selectedIds()) {
      if (map.has(id)) sum += Number(map.get(id).totalDeducciones || 0);
    }
    return sum;
  });

  totalNetoEstimado = computed(() => {
    let sum = 0;
    const map = this.displayMap();
    for (const id of this.selectedIds()) {
      if (map.has(id)) sum += Number(map.get(id).netoPagar || 0);
    }
    return sum;
  });

  assignedMap = computed(() => {
    const map = new Map<string, any>();
    for (const item of this.assignedEmpleados()) {
      map.set(item.empleadoId, item);
    }
    return map;
  });

  displayMap = computed(() => {
    const map = new Map<string, any>();
    const assigned = this.assignedMap();
    const all = this.allEmpleados();
    const selected = this.selectedIds();
    const p = this.periodo();
    const isQuincenal = p?.tipo === 'QUINCENAL';
    const dias = isQuincenal ? 15 : 30;

    for (const emp of all) {
      if (assigned.has(emp.id)) {
        map.set(emp.id, assigned.get(emp.id));
      } else if (selected.has(emp.id)) {
        const salarioProp = (Number(emp.salarioBase) / 30) * dias;
        const auxTrans = emp.auxilioTransporte ? (249095 / 30) * dias : 0;
        const devengado = salarioProp + auxTrans;
        const salud = salarioProp * 0.04;
        const pension = salarioProp * 0.04;
        const deducciones = salud + pension;
        map.set(emp.id, {
          totalDevengado: devengado,
          totalDeducciones: deducciones,
          netoPagar: devengado - deducciones,
          totalIngresosAdicionales: 0,
          isEstimate: true
        });
      }
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

    this.empresaService.getEmpresa().subscribe({
      next: (res: any) => {
        this.empresa.set(res?.data || res);
      },
      error: () => { },
    });

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

    if (this.assignedEmpleados().length === 0) {
      this.notification.error('Debe haber al menos un empleado asignado para liquidar el período');
      return;
    }

    // this.loader.show();
    try {
      await this.nominaService.liquidarPeriodo(p.id, { empleados: [] }).toPromise();
      this.notification.info('El proceso de liquidación ha comenzado en segundo plano...');
      this.pollJobStatus(p.id);
    } catch (err: any) {
      const msg = err.error?.message || err.message || 'Error desconocido';
      const finalMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      this.notification.error(finalMsg, 'Error al encolar liquidación');
      // this.loader.hide();
    }
  }

  pollJobStatus(periodoId: string) {
    const intervalId = setInterval(() => {
      this.nominaService.getJobStatus(periodoId).subscribe({
        next: (res) => {
          if (res.estado === 'COMPLETADO') {
            clearInterval(intervalId);
            this.notification.success('Nómina liquidada y contabilizada exitosamente');
            this.router.navigate(['/panel/nomina/periodos']);
            this.loader.hide();
          } else if (res.estado === 'FALLIDO') {
            clearInterval(intervalId);
            const msg = res.errores?.message || 'Error en el procesamiento en segundo plano';
            this.notification.error(msg, 'Error en liquidación');
            this.loader.hide();
          } else if (res.estado === 'NINGUNO') {
            clearInterval(intervalId);
            this.loader.hide();
          }
        },
        error: () => {
          clearInterval(intervalId);
          this.loader.hide();
        }
      });
    }, 2000);
  }

  async descargarDesprendibles() {
    const p = this.periodo();
    if (!p) return;

    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) {
      this.notification.error('Seleccione al menos un empleado para descargar desprendibles');
      return;
    }

    this.loader.show();
    try {
      const liquidaciones = await this.nominaService.getLiquidaciones(p.id).toPromise();
      if (!liquidaciones || liquidaciones.length === 0) {
        this.notification.warning('El período no tiene liquidaciones. Debe liquidar la nómina primero.');
        this.loader.hide();
        return;
      }

      const selectedLiquidaciones = liquidaciones.filter(l => ids.includes(l.empleadoId));
      if (selectedLiquidaciones.length === 0) {
        this.notification.warning('Los empleados seleccionados no tienen liquidaciones en este período.');
        this.loader.hide();
        return;
      }

      let count = 0;
      for (const liq of selectedLiquidaciones) {
        try {
          this.pdfService.generarDesprendible(liq, p, this.empresa());
          count++;
        } catch (err) {
          console.error(`Error generando desprendible para ${liq.empleadoId}`, err);
        }
      }

      this.notification.success(`${count} desprendido(s) generado(s) exitosamente`);
    } catch (err: any) {
      this.notification.error('Error al descargar desprendibles', err?.message);
    } finally {
      this.loader.hide();
    }
  }

  verDetalleEmpleado(empleadoId: string) {
    const p = this.periodo();
    if (!p) return;
    this.router.navigate(['/panel/nomina/periodos', p.id, 'empleado', empleadoId]);
  }
}
