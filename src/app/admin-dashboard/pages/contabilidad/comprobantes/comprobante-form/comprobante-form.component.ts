import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ComprobantesService } from '../../services/comprobantes.service';
import { HeaderTitlePageComponent, HeaderInput } from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { NotificationService } from '@shared/services/notification.service';
import { FormErrorLabelComponent } from '@utils/components/form-error-label/form-error-label.component';
import { EstadoComprobante, ComprobanteDetalleInterface } from '../../interfaces/comprobantes.interface';
import { ConfirmModalComponent, ConfirmModalConfig } from '@shared/components/confirm-modal/confirm-modal.component';
import { ComprobanteCatalogosFacade } from './services/comprobante-catalogos.facade';
import { ComprobanteFormStateService } from './services/comprobante-form-state.service';
import { GetCuentasContables } from '../../interfaces/cuentas-contables.interface';

@Component({
  selector: 'app-comprobante-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HeaderTitlePageComponent,
    BreadcrumbComponent,
    FormErrorLabelComponent,
    ConfirmModalComponent,
  ],
  providers: [ComprobanteCatalogosFacade, ComprobanteFormStateService],
  templateUrl: './comprobante-form.component.html',
})
export class ComprobanteFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ComprobantesService);
  private readonly toastService = inject(NotificationService);
  private readonly catalogos = inject(ComprobanteCatalogosFacade);
  private readonly formState = inject(ComprobanteFormStateService);

  confirmModal = signal<ConfirmModalConfig | null>(null);
  private confirmCallback: (() => void) | null = null;

  headTitle = signal<HeaderInput>({
    title: 'Nuevo Comprobante Contable',
    slog: 'Registra un movimiento contable manual balanceando débitos y créditos',
  });
  isEditing = signal(false);
  id = signal<string | null>(null);
  loading = signal(false);
  submitting = signal(false);
  estado = signal<EstadoComprobante>(EstadoComprobante.BORRADOR);
  consecutivo = signal('Borrador');

  form = this.formState.form;
  tiposComprobantes = this.catalogos.tiposComprobantes;
  cuentasContables = this.catalogos.cuentasContables;
  terceros = this.catalogos.terceros;
  centrosCostos = this.catalogos.centrosCostos;

  breadcrumbItems = [
    { label: 'Contabilidad', route: '/panel/contabilidad' },
    { label: 'Comprobantes', route: '/panel/contabilidad/comprobantes' },
    { label: 'Formulario' },
  ];

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({
      error: () => this.toastService.error('Error al cargar los catálogos del comprobante.'),
    });

    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.isEditing.set(true);
      this.id.set(paramId);
      this.cargarComprobante(paramId);
    } else {
      this.formState.addLine();
      this.formState.addLine();
    }
  }

  get detallesFormArray(): FormArray {
    return this.formState.detalles;
  }

  get totalDebitos(): number { return this.formState.totalDebitos; }
  get totalCreditos(): number { return this.formState.totalCreditos; }
  get diferencia(): number { return this.formState.diferencia; }
  get estaBalanceado(): boolean { return this.formState.estaBalanceado; }

  private cargarComprobante(id: string): void {
    this.loading.set(true);
    this.service.findOne(id).subscribe({
      next: (comprobante) => {
        this.estado.set(comprobante.estado);
        this.consecutivo.set(comprobante.numero);
        this.headTitle.set({
          title: `Comprobante ${comprobante.numero}`,
          slog: `Estado: ${comprobante.estado} | Creado por: ${comprobante.creadoPor?.fullName || ''}`,
        });
        this.form.patchValue({
          tipoComprobanteId: comprobante.tipoComprobanteId,
          fechaDocumento: comprobante.fechaDocumento.substring(0, 10),
          observaciones: comprobante.observaciones || '',
        });
        comprobante.detalles.forEach((detalle) => this.formState.addLine(detalle));
        if (comprobante.estado !== EstadoComprobante.BORRADOR) this.form.disable();
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar el comprobante contable.');
        this.router.navigate(['/panel/contabilidad/comprobantes']);
        this.loading.set(false);
      },
    });
  }

  agregarLinea(): void { this.formState.addLine(); }

  eliminarLinea(index: number): void {
    if (!this.formState.removeLine(index)) {
      this.toastService.error('Un comprobante debe tener al menos 2 movimientos.');
    }
  }

  onCuentaCambio(index: number): void {
    const control = this.detallesFormArray.at(index);
    const cuenta = this.cuentaDeLinea(control.value.cuentaContableId);
    if (!cuenta) return;
    if (!cuenta.requiereTercero) control.get('terceroUnionId')?.setValue('');
    if (!cuenta.requiereCentroCostos) control.get('centroCostoId')?.setValue('');
  }

  requiereTercero(index: number): boolean {
    return this.cuentaDeLinea(this.detallesFormArray.at(index).value.cuentaContableId)?.requiereTercero ?? false;
  }

  requiereCentro(index: number): boolean {
    return this.cuentaDeLinea(this.detallesFormArray.at(index).value.cuentaContableId)?.requiereCentroCostos ?? false;
  }

  requiereRefDoc(): boolean {
    const tipo = this.tiposComprobantes().find((item) => item.id === this.form.get('tipoComprobanteId')?.value);
    return tipo?.docReferenciaObligatorio ?? false;
  }

  cuadrarAsiento(index: number): void { this.formState.squareLine(index); }

  guardarBorrador(): void {
    this.guardar(false);
  }

  guardarYContabilizar(): void {
    this.guardar(true);
  }

  contabilizarComprobante(): void {
    if (!this.id()) return;
    this.pedirConfirmacion({
      title: 'Contabilizar Comprobante',
      message: '¿Estás seguro de contabilizar este comprobante contable?',
      detail: 'Se volverá inmutable y registrará los movimientos contables definitivos.',
      icon: 'warning',
      confirmLabel: 'Sí, Contabilizar',
      confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
    }, () => {
      this.loading.set(true);
      this.service.contabilizar(this.id()!).subscribe({
        next: () => {
          this.toastService.success('Comprobante contabilizado con éxito.');
          this.cargarComprobante(this.id()!);
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al contabilizar.');
          this.loading.set(false);
        },
      });
    });
  }

  onConfirmado(): void {
    this.confirmCallback?.();
    this.confirmModal.set(null);
    this.confirmCallback = null;
  }

  onCancelado(): void {
    this.confirmModal.set(null);
    this.confirmCallback = null;
  }

  private guardar(contabilizar: boolean): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Por favor complete los campos requeridos marcados en rojo.');
      return;
    }
    if (!this.estaBalanceado) {
      this.toastService.error(`El comprobante está descuadrado por $${this.diferencia.toLocaleString('es-CO')}.`);
      return;
    }

    this.submitting.set(true);
    const payload = this.formState.buildPayload(this.terceros());
    const request$ = this.isEditing() && this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: (comprobante) => {
        if (!contabilizar) {
          this.toastService.success(this.isEditing() ? 'Borrador actualizado con éxito.' : `Comprobante ${comprobante.numero} creado en estado Borrador.`);
          this.router.navigate(['/panel/contabilidad/comprobantes']);
          return;
        }
        this.service.contabilizar(comprobante.id).subscribe({
          next: () => {
            this.toastService.success('Comprobante guardado y contabilizado con éxito.');
            this.router.navigate(['/panel/contabilidad/comprobantes']);
          },
          error: (err) => {
            this.toastService.error(err.error?.message || 'Error al contabilizar.', 'Error Contable');
            this.submitting.set(false);
          },
        });
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al guardar el comprobante.');
        this.submitting.set(false);
      },
    });
  }

  private cuentaDeLinea(cuentaId: string): GetCuentasContables | undefined {
    return this.cuentasContables().find((cuenta) => cuenta.id === cuentaId);
  }

  private pedirConfirmacion(config: ConfirmModalConfig, onConfirm: () => void): void {
    this.confirmModal.set(config);
    this.confirmCallback = onConfirm;
  }
}
