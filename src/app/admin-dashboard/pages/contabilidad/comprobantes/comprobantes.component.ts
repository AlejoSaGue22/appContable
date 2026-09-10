import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComprobantesService } from '../services/comprobantes.service';
import { ComprobanteContableInterface, EstadoComprobante } from '../interfaces/comprobantes.interface';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ModalComponents } from '@shared/components/modal.components/modal.components';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '@shared/components/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { PaginationService } from '@shared/components/pagination/pagination.service';

@Component({
  selector: 'app-comprobantes',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    HeaderTitlePageComponent,
    BreadcrumbComponent,
    ModalComponents,
    ConfirmModalComponent,
    PaginationComponent,
  ],
  templateUrl: './comprobantes.component.html',
})
export class ComprobantesComponent implements OnInit {
  public service = inject(ComprobantesService);
  private toastService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private paginationService = inject(PaginationService);

  public headTitle = signal({
    title: 'Comprobantes Contables',
    slog: 'Registra, previsualiza y contabiliza asientos de ajuste, provisiones y depreciaciones',
  });

  breadcrumbItems = [
    { label: 'Contabilidad', route: '/panel/contabilidad' },
    { label: 'Comprobantes Contables' },
  ];

  // ── Filtros ──────────────────────────────────────────────────────
  filtroTexto = new FormControl('');
  filtroEstado = new FormControl<EstadoComprobante | ''>('');
  filtroFechaInicio = new FormControl('');
  filtroFechaFin = new FormControl('');

  textoSignal = toSignal(
    this.filtroTexto.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(v => v?.trim() ?? ''),
    ),
    { initialValue: this.filtroTexto.value ?? '' }
  );
  estadoSignal = toSignal(this.filtroEstado.valueChanges, { initialValue: this.filtroEstado.value ?? '' });
  fechaInicioSignal = toSignal(this.filtroFechaInicio.valueChanges, { initialValue: this.filtroFechaInicio.value ?? '' });
  fechaFinSignal = toSignal(this.filtroFechaFin.valueChanges, { initialValue: this.filtroFechaFin.value ?? '' });

  filteredComprobantes = computed(() => this.service.comprobantes());

  limpiarFiltros(): void {
    this.filtroTexto.setValue('', { emitEvent: false });
    this.filtroEstado.setValue('', { emitEvent: false });
    this.filtroFechaInicio.setValue('', { emitEvent: false });
    this.filtroFechaFin.setValue('', { emitEvent: false });
    this.cargar();
  }

  // Modal de confirmación
  confirmModal = signal<ConfirmModalConfig | null>(null);
  private confirmCallback: (() => void) | null = null;

  // Estado local para anulación
  public isAnularModalOpen = signal(false);
  public selectedComprobanteId = signal<string | null>(null);
  public anularForm: FormGroup = this.fb.group({
    motivo: ['', [Validators.required, Validators.minLength(5)]],
  });

  // Estado local para previsualización de asiento
  public isPreviewModalOpen = signal(false);
  public previewAsiento = signal<any>(null);
  public previewLoading = signal(false);

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

  constructor() {
    effect(() => {
      this.textoSignal();
      this.estadoSignal();
      this.fechaInicioSignal();
      this.fechaFinSignal();
      this.paginationService.currentPage();
      this.cargar();
    });
  }

  ngOnInit(): void {
    // cargar se llama en el effect
  }

  cargar(): void {
    this.service.loadComprobantes({
      page: this.paginationService.currentPage(),
      limit: 10,
      busqueda: this.textoSignal() || undefined,
      estado: this.estadoSignal() || undefined,
      fechaInicio: this.fechaInicioSignal() || undefined,
      fechaFin: this.fechaFinSignal() || undefined
    }).subscribe({
      next: (res) => {
        this.paginationService.totalItems.set(res.meta.total);
        this.paginationService.pageSize.set(res.meta.totalPages);
      }
    });
  }

  contabilizar(id: string) {
    this.pedirConfirmacion(
      {
        title: 'Contabilizar Comprobante',
        message: '¿Estás seguro de contabilizar este comprobante?',
        detail: 'Se generará el asiento contable definitivo y afectará saldos en la contabilidad.',
        icon: 'warning',
        confirmLabel: 'Sí, Contabilizar',
        confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
      },
      () => {
        this.service.contabilizar(id).subscribe({
          next: () => {
            this.toastService.success('Comprobante contabilizado y asiento generado con éxito');
          },
          error: (err) => {
            this.toastService.error(
              err.error?.message || 'Error al contabilizar el comprobante',
              'Error Contable'
            );
          },
        });
      }
    );
  }

  openAnularModal(id: string) {
    this.selectedComprobanteId.set(id);
    this.anularForm.reset();
    this.isAnularModalOpen.set(true);
  }

  closeAnularModal() {
    this.isAnularModalOpen.set(false);
    this.selectedComprobanteId.set(null);
  }

  confirmarAnulacion() {
    if (this.anularForm.invalid || !this.selectedComprobanteId()) {
      this.anularForm.markAllAsTouched();
      return;
    }

    const motivo = this.anularForm.value.motivo;
    const id = this.selectedComprobanteId()!;

    this.service.anular(id, motivo).subscribe({
      next: () => {
        this.toastService.success('Comprobante anulado y asiento de reverso generado');
        this.closeAnularModal();
      },
      error: (err) => {
        this.toastService.error(
          err.error?.message || 'Error al anular el comprobante',
          'Error Contable'
        );
      },
    });
  }

  verPrevisualizacion(id: string) {
    this.previewLoading.set(true);
    this.previewAsiento.set(null);
    this.isPreviewModalOpen.set(true);

    this.service.preview(id).subscribe({
      next: (res) => {
        this.previewAsiento.set(res);
        this.previewLoading.set(false);
      },
      error: (err) => {
        this.toastService.error(
          err.error?.message || 'No se pudo generar la previsualización del asiento.',
          'Error'
        );
        this.isPreviewModalOpen.set(false);
        this.previewLoading.set(false);
      },
    });
  }

  getAsientosList(): any[] {
    const val = this.previewAsiento();
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }
}

