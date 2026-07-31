import { Component, Input, OnInit, inject, signal, computed, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NominaService } from '../../../services/nomina.service';
import { Empleado, ConceptoNomina, ConceptoConsolidadoItem } from '../../../interfaces/nomina.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
  selector: 'app-concepto-periodo-popover',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './concepto-periodo-popover.component.html',
})
export class ConceptoPeriodoPopoverComponent implements OnInit {
  @Input({ required: true }) periodoId!: string;
  @Input({ required: true }) empleado!: Empleado;
  @Input() tipoView: 'DEVENGADO' | 'DEDUCCION' = 'DEVENGADO';

  close = output<void>();
  updated = output<void>();

  private nominaService = inject(NominaService);
  private notification = inject(NotificationService);
  private loader = inject(LoaderService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  recurrentes = signal<ConceptoConsolidadoItem[]>([]);
  ocasionales = signal<ConceptoConsolidadoItem[]>([]);
  masterConceptos = signal<ConceptoNomina[]>([]);
  showAddForm = signal(false);

  form: FormGroup = this.fb.group({
    conceptoId: ['', Validators.required],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    tipoValor: ['FIJO', Validators.required],
    observacion: [''],
  });

  // Conceptos filtrados por categoría (DEVENGADO o DEDUCCION)
  recurrentesFiltrados = computed(() =>
    this.recurrentes().filter((c) => c.tipo === this.tipoView)
  );

  ocasionalesFiltrados = computed(() =>
    this.ocasionales().filter((c) => c.tipo === this.tipoView)
  );

  masterConceptosFiltrados = computed(() =>
    this.masterConceptos().filter((c) => c.tipo === this.tipoView && c.activo)
  );

  totalMonto = computed(() => {
    let total = 0;
    if (this.tipoView === 'DEVENGADO') {
      total += Number(this.empleado.salarioBase || 0);
    }
    for (const item of this.recurrentesFiltrados()) total += Number(item.valor);
    for (const item of this.ocasionalesFiltrados()) total += Number(item.valor);
    return total;
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const [consol, conceptos] = await Promise.all([
        this.nominaService.getConceptosConsolidadosPeriodoEmpleado(this.periodoId, this.empleado.id).toPromise(),
        this.nominaService.getConceptos().toPromise(),
      ]);

      this.recurrentes.set(consol?.recurrentes || []);
      this.ocasionales.set(consol?.ocasionales || []);
      this.masterConceptos.set(conceptos || []);
    } catch (err: any) {
      this.notification.error('Error al cargar conceptos del período', err?.message);
    } finally {
      this.loading.set(false);
    }
  }

  toggleAddForm() {
    this.showAddForm.update((v) => !v);
    if (!this.showAddForm()) {
      this.form.reset({ tipoValor: 'FIJO', valor: 0, conceptoId: '', observacion: '' });
    }
  }

  async onSubmitNewConcepto() {
    if (this.form.invalid) {
      this.notification.error('Complete los campos obligatorios del concepto');
      return;
    }

    this.loader.show();
    try {
      await this.nominaService
        .addConceptoOcasionalPeriodo(this.periodoId, this.empleado.id, this.form.value)
        .toPromise();

      this.notification.success(
        `${this.tipoView === 'DEVENGADO' ? 'Ingreso' : 'Deducción'} agregada únicamente para este período`
      );
      this.toggleAddForm();
      await this.loadData();
      this.updated.emit();
    } catch (err: any) {
      this.notification.error('Error al agregar concepto al período', err?.message);
    } finally {
      this.loader.hide();
    }
  }

  async removeOcasional(item: ConceptoConsolidadoItem) {
    this.loader.show();
    try {
      await this.nominaService.removeConceptoOcasionalPeriodo(item.id).toPromise();
      this.notification.success('Concepto retirado de esta nómina');
      await this.loadData();
      this.updated.emit();
    } catch (err: any) {
      this.notification.error('Error al eliminar concepto', err?.message);
    } finally {
      this.loader.hide();
    }
  }
}
