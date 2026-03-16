// registrar-pago-modal.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CuentaBancaria, MedioPago } from '@dashboard/interfaces/pagos-interface';
import { PagosHttpService } from '../../services/pagos.service';
import { NotificationService } from '@shared/services/notification.service';


export interface RegistrarPagoModalData {
  tipo:            'cobro' | 'pago';
  documentoId:     string;
  numeroDocumento: string;
  contraparte:     string;
  total:           number;
  saldoPendiente:  number;
}

/**
 * Uso en el template padre:
 *
 * <app-modal [(visible)]="modalVisible" [title]="modalTitulo" width="max-w-lg">
 *   <app-registrar-pago-modal
 *     [data]="modalData"
 *     (success)="onPagoRegistrado($event)"
 *     (cancel)="modalVisible = false" />
 * </app-modal>
 */
@Component({
  selector: 'app-registrar-pago-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-registrarpago.component.html',
})
export class RegistrarPagoModalComponent implements OnInit {
  @Input({ required: true }) data!: RegistrarPagoModalData;
  @Output() success = new EventEmitter<any>();
  @Output() cancel  = new EventEmitter<void>();

  form!: FormGroup;
  cuentasBancarias: CuentaBancaria[] = [];
  loading       = false;
  loadingCuentas = true;

  get requiereCuenta(): boolean {
    const val = this.form?.get('medioPago')?.value;
    return ['banco', 'transferencia', 'cheque'].includes(val);
  }

  constructor(
    private fb:   FormBuilder,
    private svc:  PagosHttpService,
    private notif: NotificationService,
  ) {}

  ngOnInit(): void {
    const hoy = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      monto:            [this.data.saldoPendiente, [
        Validators.required,
        Validators.min(1),
        Validators.max(this.data.saldoPendiente),
      ]],
      fecha:            [hoy, Validators.required],
      medioPago:        ['banco', Validators.required],
      cuentaBancariaId: [null],
      referencia:       [''],
      notas:            [''],
    });

    // Validación dinámica de cuenta bancaria
    this.form.get('medioPago')!.valueChanges.subscribe(val => {
      const ctrl = this.form.get('cuentaBancariaId')!;
      if (val !== 'caja') {
        ctrl.setValidators(Validators.required);
      } else {
        ctrl.clearValidators();
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity();
    });
    // Disparar validación inicial
    this.form.get('medioPago')!.updateValueAndValidity();

    this.svc.getCuentasBancarias().subscribe({
      next:  c  => { this.cuentasBancarias = c; this.loadingCuentas = false; },
      error: () => { this.loadingCuentas = false; },
    });
  }

  pagarTotal(): void {
    this.form.patchValue({ monto: this.data.saldoPendiente });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    const val = this.form.value;

    const dto = {
      monto:            Math.round(Number(val.monto)),
      fecha:            val.fecha,
      medioPago:        val.medioPago as MedioPago,
      ...(val.cuentaBancariaId && { cuentaBancariaId: val.cuentaBancariaId }),
      ...(val.referencia        && { referencia:       val.referencia }),
      ...(val.notas             && { notas:            val.notas }),
    };

    const obs$ = this.data.tipo === 'cobro'
      ? this.svc.registrarCobro(this.data.documentoId, dto)
      : this.svc.registrarPago(this.data.documentoId, dto);

    obs$.subscribe({
      next: result => {
        this.loading = false;
        const msg = result.message ?? (this.data.tipo === 'cobro' ? 'Cobro registrado correctamente.' : 'Pago registrado correctamente.');
        this.notif.success(msg);
        this.success.emit(result);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message ?? 'Ocurrió un error al procesar la operación.';
        this.notif.error(msg);
      },
    });
  }

  cerrar(): void {
    this.cancel.emit();
  }
}