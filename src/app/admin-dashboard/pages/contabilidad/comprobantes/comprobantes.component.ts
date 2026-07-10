import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComprobantesService } from '../services/comprobantes.service';
import { ComprobanteContableInterface, EstadoComprobante } from '../interfaces/comprobantes.interface';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ModalComponents } from '@shared/components/modal.components/modal.components';
import { NotificationService } from '@shared/services/notification.service';

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
  ],
  templateUrl: './comprobantes.component.html',
})
export class ComprobantesComponent implements OnInit {
  public service = inject(ComprobantesService);
  private toastService = inject(NotificationService);
  private fb = inject(FormBuilder);

  public headTitle = signal({
    title: 'Comprobantes Contables',
    slog: 'Registra, previsualiza y contabiliza asientos de ajuste, provisiones y depreciaciones',
  });

  breadcrumbItems = [
    { label: 'Contabilidad', route: '/panel/contabilidad' },
    { label: 'Comprobantes Contables' },
  ];

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

  ngOnInit(): void {
    this.service.loadComprobantes().subscribe();
  }

  contabilizar(id: string) {
    if (confirm('¿Estás seguro de contabilizar este comprobante? Se generará el asiento contable definitivo y afectará saldos.')) {
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
}
