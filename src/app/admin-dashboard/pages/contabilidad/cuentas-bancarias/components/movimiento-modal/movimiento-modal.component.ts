import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CuentasBancariasService } from '../../../services/cuentas-bancarias.service';
import { CuentasContablesService } from '../../../services/cuentas-contables.service';
import { CuentaBancaria } from '../../../interfaces/cuenta-bancaria.interface';
import { GetCuentasContables } from '../../../interfaces/cuentas-contables.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { ListGroupDropdownComponent } from '@shared/components/list-group-dropdown/list-group-dropdown.component';
import { CurrencyFormatDirective } from '@shared/directives/currency-format.directive';

export type TipoMovimiento = 'ingreso' | 'egreso';

@Component({
  selector: 'app-movimiento-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ListGroupDropdownComponent, CurrencyFormatDirective],
  templateUrl: './movimiento-modal.component.html',
})
export class MovimientoModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cuentasService = inject(CuentasBancariasService);
  private cuentasContablesService = inject(CuentasContablesService);
  private notificationService = inject(NotificationService);
  private loaderService = inject(LoaderService);

  @Input() isOpen = false;
  @Input() cuenta: CuentaBancaria | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  form = this.fb.group({
    tipo: new FormControl<TipoMovimiento | null>('ingreso', Validators.required),
    monto: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    cuentaContrapartidaCodigo: new FormControl<string | null>(null, Validators.required),
    observaciones: new FormControl<string | null>(''),
  });

  cuentasContables = signal<GetCuentasContables[]>([]);
  isSubmitting = signal(false);

  contrapartidas = computed(() =>
    this.cuentasContables().filter((c) => c.aceptaMovimiento),
  );

  get esIngreso(): boolean {
    return this.form.get('tipo')?.value === 'ingreso';
  }

  ngOnInit(): void {
    this.cuentasContablesService.getCuentasContables({ limit: 1000 }).subscribe({
      next: (res) => this.cuentasContables.set(res.filter((c) => c.aceptaMovimiento)),
      error: () => this.notificationService.error('Error al cargar cuentas contables'),
    });
  }

  onContrapartidaSelect(cuenta: GetCuentasContables): void {
    this.form.patchValue({ cuentaContrapartidaCodigo: cuenta.codigo });
  }

  getContrapartidaDisplay(): string {
    const codigo = this.form.get('cuentaContrapartidaCodigo')?.value;
    if (!codigo) return '';
    const found = this.cuentasContables().find((c) => c.codigo === codigo);
    return found ? `${found.codigo} - ${found.nombre}` : codigo;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.cuenta) {
      this.form.markAllAsTouched();
      this.notificationService.error('Por favor, complete el formulario correctamente');
      return;
    }
    const raw = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.loaderService.show();
    this.cuentasService
      .registrarMovimiento(this.cuenta.id, {
        tipo: raw.tipo ?? 'ingreso',
        monto: Number(raw.monto ?? 0),
        cuentaContrapartidaCodigo: raw.cuentaContrapartidaCodigo ?? '',
        observaciones: raw.observaciones ?? '',
      })
      .subscribe({
        next: () => {
          this.notificationService.success('Movimiento registrado con éxito');
          this.submit.emit();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.notificationService.error(err?.error?.message ?? 'Error al registrar el movimiento');
          this.isSubmitting.set(false);
        },
        complete: () => this.loaderService.hide(),
      });
  }

  onClose(): void {
    this.form.reset({ tipo: 'ingreso', monto: null });
    this.close.emit();
  }
}
