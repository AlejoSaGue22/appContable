import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CuentaBancaria, MedioPago } from '@dashboard/interfaces/pagos-interface';
import { PagosHttpService } from '../../services/pagos.service';
import { NotificationService } from '@shared/services/notification.service';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { CuentasBancariasService } from '@dashboard/pages/contabilidad/services/cuentas-bancarias.service';

export interface RegistrarPagoModalData {
    tipo: 'cobro' | 'pago';
    documentoId: string;
    numeroDocumento: string;
    contraparte: string;
    total: number;
    saldoPendiente: number;
}

@Component({
    selector: 'app-registrar-pago-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './modal-registrarpago.component.html',
})
export class RegistrarPagoModalComponent implements OnInit {
    @Input({ required: true }) data!: RegistrarPagoModalData;
    @Output() success = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();
    catalogsStore = inject(CatalogsStore);
    cuentasBancariasService = inject(CuentasBancariasService);

    form!: FormGroup;
    cuentasBancarias = signal<CuentaBancaria[]>([]);
    loading = signal(false);
    loadingCuentas = signal(true);
    medioPagos = computed(() => this.catalogsStore.paymentMethods());

    constructor(
        private fb: FormBuilder,
        private svc: PagosHttpService,
        private notif: NotificationService,
    ) { }

    ngOnInit(): void {
        const hoy = new Date().toISOString().split('T')[0];

        this.form = this.fb.group({
            monto: [this.data.saldoPendiente, [
                Validators.required,
                Validators.min(1),
                Validators.max(this.data.saldoPendiente),
            ]],
            fecha: [hoy, Validators.required],
            medioPago: ['banco', Validators.required],
            cuentaBancariaId: [null],
            referencia: [''],
            notas: [''],
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
            next: c => { this.cuentasBancarias.set(c); this.loadingCuentas.set(false); },
            error: () => { this.loadingCuentas.set(false); },
        });
    }

    pagarTotal(): void {
        this.form.patchValue({ monto: this.data.saldoPendiente });
    }

    submit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        this.loading.set(true);
        const val = this.form.value;

        const dto = {
            monto: Math.round(Number(val.monto)),
            fecha: val.fecha,
            medioPago: val.medioPago as MedioPago,
            ...(val.cuentaBancariaId && { cuentaBancariaId: val.cuentaBancariaId }),
            ...(val.referencia && { referencia: val.referencia }),
            ...(val.notas && { notas: val.notas }),
        };

        const obs$ = this.data.tipo === 'cobro'
            ? this.svc.registrarCobro(this.data.documentoId, dto)
            : this.svc.registrarPago(this.data.documentoId, dto);

        obs$.subscribe({
            next: result => {
                this.loading.set(false);
                const msg = result.message ?? (this.data.tipo === 'cobro' ? 'Cobro registrado correctamente.' : 'Pago registrado correctamente.');
                this.notif.success(msg);
                this.success.emit(result);
            },
            error: (err) => {
                this.loading.set(false);
                const msg = err?.error?.message ?? 'Ocurrió un error al procesar la operación.';
                this.notif.error(msg);
            },
        });
    }

    cerrar(): void {
        this.cancel.emit();
    }
}