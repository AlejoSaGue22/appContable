import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NominaService } from '../../../services/nomina.service';
import { Empleado, ConceptoNomina, EmpleadoConceptoRecurrente } from '../../../interfaces/nomina.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '@shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-conceptos-recurrentes-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe, ConfirmModalComponent],
  templateUrl: './conceptos-recurrentes-tab.component.html',
})
export class ConceptosRecurrentesTabComponent implements OnInit {
  @Input({ required: true }) empleado!: Empleado;

  private nominaService = inject(NominaService);
  private notification = inject(NotificationService);
  private loader = inject(LoaderService);
  private fb = inject(FormBuilder);

  conceptosMaster = signal<ConceptoNomina[]>([]);
  recurrentes = signal<EmpleadoConceptoRecurrente[]>([]);
  loading = signal(true);

  // Modal de confirmación
  confirmModal = signal<ConfirmModalConfig | null>(null);
  private confirmCallback: (() => void) | null = null;

  // Modal State
  showModal = signal(false);
  modalTipo = signal<'DEVENGADO' | 'DEDUCCION'>('DEVENGADO');
  editingItem = signal<EmpleadoConceptoRecurrente | null>(null);
  hasFechaFin = signal(false);

  form: FormGroup = this.fb.group({
    conceptoId: ['', Validators.required],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    tipoValor: ['FIJO', Validators.required],
    fechaInicio: [new Date().toISOString().split('T')[0], Validators.required],
    fechaFin: [''],
    observacion: [''],
  });

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

  // Totales
  totalIngresos = computed(() => {
    return this.recurrentes()
      .filter((r) => r.activo && r.concepto?.tipo === 'DEVENGADO')
      .reduce((sum, r) => sum + Number(r.valor), 0);
  });

  totalDeducciones = computed(() => {
    return this.recurrentes()
      .filter((r) => r.activo && r.concepto?.tipo === 'DEDUCCION')
      .reduce((sum, r) => sum + Number(r.valor), 0);
  });

  // Listas filtradas
  percepcionesList = computed(() => {
    return this.recurrentes().filter((r) => r.concepto?.tipo === 'DEVENGADO');
  });

  deduccionesList = computed(() => {
    return this.recurrentes().filter((r) => r.concepto?.tipo === 'DEDUCCION');
  });

  conceptosFiltradosModal = computed(() => {
    const tipo = this.modalTipo();
    return this.conceptosMaster().filter((c) => c.tipo === tipo && c.activo);
  });

  costoReflejadoPreview = computed(() => {
    const valor = Number(this.form.get('valor')?.value) || 0;
    const tipoValor = this.form.get('tipoValor')?.value;
    if (tipoValor === 'PORCENTAJE') {
      return (Number(this.empleado?.salarioBase || 0) * valor) / 100;
    }
    return valor;
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const [master, items] = await Promise.all([
        this.nominaService.getConceptos().toPromise(),
        this.nominaService.getConceptosRecurrentesByEmpleado(this.empleado.id).toPromise(),
      ]);
      this.conceptosMaster.set(master || []);
      this.recurrentes.set(items || []);
    } catch (err: any) {
      this.notification.error('Error al cargar conceptos recurrentes', err?.message);
    } finally {
      this.loading.set(false);
    }
  }

  openModal(tipo: 'DEVENGADO' | 'DEDUCCION', itemToEdit: EmpleadoConceptoRecurrente | null = null) {
    this.modalTipo.set(tipo);
    this.editingItem.set(itemToEdit);
    this.hasFechaFin.set(!!itemToEdit?.fechaFin);

    if (itemToEdit) {
      this.form.patchValue({
        conceptoId: itemToEdit.conceptoId,
        valor: itemToEdit.valor,
        tipoValor: itemToEdit.tipoValor || 'FIJO',
        fechaInicio: itemToEdit.fechaInicio,
        fechaFin: itemToEdit.fechaFin || '',
        observacion: itemToEdit.observacion || '',
      });
    } else {
      this.form.reset({
        conceptoId: '',
        valor: 0,
        tipoValor: 'FIJO',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: '',
        observacion: '',
      });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingItem.set(null);
  }

  toggleHasFechaFin() {
    this.hasFechaFin.set(!this.hasFechaFin());
    if (!this.hasFechaFin()) {
      this.form.patchValue({ fechaFin: '' });
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const conceptoCtrl = this.form.get('conceptoId');
      const valorCtrl = this.form.get('valor');
      if (conceptoCtrl?.invalid) this.notification.error('Seleccione un tipo de concepto');
      else if (valorCtrl?.invalid) this.notification.error('El valor debe ser mayor a 0');
      return;
    }

    const val = this.form.value;
    const dto = {
      conceptoId: val.conceptoId,
      valor: Number(val.valor),
      tipoValor: val.tipoValor,
      fechaInicio: val.fechaInicio,
      fechaFin: this.hasFechaFin() && val.fechaFin ? val.fechaFin : undefined,
      observacion: val.observacion,
    };

    this.loader.show();
    try {
      const editing = this.editingItem();
      if (editing) {
        await this.nominaService.updateEmpleadoConcepto(editing.id, dto).toPromise();
        this.notification.success('Concepto recurrente actualizado');
      } else {
        await this.nominaService.createEmpleadoConcepto(this.empleado.id, dto).toPromise();
        this.notification.success('Concepto recurrente agregado exitosamente');
      }
      this.closeModal();
      this.loadData();
    } catch (err: any) {
      this.notification.error('Error al guardar concepto', err?.message);
    } finally {
      this.loader.hide();
    }
  }

  async toggleActive(item: EmpleadoConceptoRecurrente) {
    try {
      await this.nominaService.toggleEmpleadoConcepto(item.id).toPromise();
      this.notification.success(`Concepto ${item.activo ? 'desactivado' : 'activado'}`);
      this.loadData();
    } catch (err: any) {
      this.notification.error('Error al cambiar estado', err?.message);
    }
  }

  deleteItem(item: EmpleadoConceptoRecurrente) {
    const nombre = item.concepto?.nombre || 'este concepto';
    this.pedirConfirmacion(
      {
        title: 'Eliminar Concepto Recurrente',
        message: `¿Está seguro de eliminar el concepto "${nombre}"?`,
        detail: 'Esta acción removerá el concepto de la liquidación de este empleado.',
        icon: 'danger',
        confirmLabel: 'Sí, Eliminar',
        confirmClass: 'bg-red-600 hover:bg-red-700',
      },
      async () => {
        this.loader.show();
        try {
          await this.nominaService.deleteEmpleadoConcepto(item.id).toPromise();
          this.notification.success('Concepto eliminado exitosamente');
          this.loadData();
        } catch (err: any) {
          this.notification.error('Error al eliminar concepto', err?.message);
        } finally {
          this.loader.hide();
        }
      }
    );
  }
}
