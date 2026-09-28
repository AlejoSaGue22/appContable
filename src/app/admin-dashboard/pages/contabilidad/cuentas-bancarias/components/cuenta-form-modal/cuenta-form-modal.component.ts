import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CuentasBancariasService } from '../../../services/cuentas-bancarias.service';
import {
  Banco,
  CuentaBancaria,
  TipoCuentaBancaria,
} from '../../../interfaces/cuenta-bancaria.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { CuentasContablesService } from '../../../services/cuentas-contables.service';
import { ListGroupDropdownComponent } from '@shared/components/list-group-dropdown/list-group-dropdown.component';
import { GetCuentasContables } from '@dashboard/interfaces/catalogs-interface';
import { CurrencyFormatDirective } from '@shared/directives/currency-format.directive';

@Component({
  selector: 'app-cuenta-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ListGroupDropdownComponent, CurrencyFormatDirective],
  templateUrl: './cuenta-form-modal.component.html',
})
export class CuentaFormModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cuentasService = inject(CuentasBancariasService);
  private cuentasContablesService = inject(CuentasContablesService);
  private notificationService = inject(NotificationService);
  private loaderService = inject(LoaderService);

  @Input() isOpen = false;
  @Input() account: CuentaBancaria | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<'create' | 'update'>();

  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    bancoId: [''],
    tipoCuenta: [TipoCuentaBancaria.BANCO, [Validators.required]],
    numeroCuenta: ['', [Validators.maxLength(30)]],
    codigoCuentaContable: ['', [Validators.required]],
    saldoInicial: [0, [Validators.required]],
    cuentaContrapartidaCodigo: [''],
    observaciones: ['', [Validators.maxLength(500)]],
  });

  bancos = signal<Banco[]>([]);
  cuentasContables = signal<GetCuentasContables[]>([]);
  tiposCuenta = Object.values(TipoCuentaBancaria);
  isSubmitting = signal(false);

  cuentasContableActivos = computed(() => {
    const cuentasContables = this.cuentasContables();
    return cuentasContables.filter(
      (c) => c.aceptaMovimiento && c.codigo.startsWith('13') ||
        c.aceptaMovimiento && c.codigo.startsWith('3') ||
        c.aceptaMovimiento && c.codigo.startsWith('11')
    );
  });

  /** Saldo contable actual de la cuenta asociada elegida (fuente de verdad). */
  cuentaAsociadaSaldo = computed<number | null>(() => {
    const codigo = this.form.get('codigoCuentaContable')?.value as string | null;
    if (!codigo) return null;
    const found = this.cuentasContables().find((c) => c.codigo === codigo);
    return found?.saldo ?? null;
  });

  /** Saldo final proyectado = saldo contable + aporte inicial (acepta negativos). */
  saldoProyectado = computed<number | null>(() => {
    const base = this.cuentaAsociadaSaldo();
    if (base === null) return null;
    const aporte = Number(this.form.get('saldoInicial')?.value ?? 0);
    return Math.round((base + aporte) * 100) / 100;
  });

  get esBanco(): boolean {
    return this.form.get('tipoCuenta')?.value === TipoCuentaBancaria.BANCO;
  }

  /** La contrapartida se exige con cualquier aporte distinto de cero (positivo o negativo). */
  get requiereContrapartida(): boolean {
    return Number(this.form.get('saldoInicial')?.value ?? 0) !== 0;
  }

  getCuentaContableDisplay(): string {
    const codigo = this.form.get('codigoCuentaContable')?.value;
    if (!codigo) return '';
    const cuenta = this.cuentasContables().find((c) => c.codigo === codigo);
    return cuenta ? `${cuenta.codigo} - ${cuenta.nombre}` : codigo;
  }

  ngOnInit() {
    this.loadBancos();
    this.loadCuentasContables();

    this.form.get('tipoCuenta')?.valueChanges.subscribe((tipo) => {
      const bancoControl = this.form.get('bancoId');
      if (tipo === TipoCuentaBancaria.BANCO) {
        bancoControl?.setValidators([Validators.required]);
      } else {
        bancoControl?.clearValidators();
        bancoControl?.setValue('');
      }
      bancoControl?.updateValueAndValidity();
    });

    this.form.get('saldoInicial')?.valueChanges.subscribe((saldo) => {
      const contrapartidaControl = this.form.get('cuentaContrapartidaCodigo');
      if (Number(saldo ?? 0) !== 0) {
        contrapartidaControl?.setValidators([Validators.required]);
      } else {
        contrapartidaControl?.clearValidators();
        contrapartidaControl?.setValue('');
      }
      contrapartidaControl?.updateValueAndValidity();
    });

    if (this.account) {
      this.form.patchValue({
        nombre: this.account.nombre,
        bancoId: this.account.banco?.id || '',
        tipoCuenta: this.account.tipoCuenta,
        numeroCuenta: this.account.numeroCuenta,
        codigoCuentaContable: this.account.codigoCuentaContable,
        saldoInicial: this.account.saldoInicial,
        observaciones: this.account.observaciones,
      });
      this.form.get('saldoInicial')?.disable();
      this.form.get('codigoCuentaContable')?.disable();
      this.form.get('cuentaContrapartidaCodigo')?.disable();
      this.form.get('tipoCuenta')?.disable();
    }
  }

  loadBancos() {
    this.cuentasService.getBancos().subscribe({
      next: (data) => this.bancos.set(data.data),
      error: (err) => {
        this.notificationService.error('Error al cargar los bancos', err);
      },
    });
  }

  loadCuentasContables() {
    this.cuentasContablesService
      .getCuentasContables({ limit: 1000 })
      .subscribe({
        next: (res) => {
          const cuentasMovimiento = res.filter((c) => c.aceptaMovimiento);
          this.cuentasContables.set(cuentasMovimiento);
        },
        error: (err) => console.error('Error cargando cuentas contables', err),
      });
  }

  onCuentaSeleccionada(cuenta: GetCuentasContables) {
    this.form.patchValue({ cuentaContrapartidaCodigo: cuenta.codigo });
  }

  onSelectCuentaContable(cuenta: GetCuentasContables) {
    this.form.patchValue({ codigoCuentaContable: cuenta.codigo });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error(
        'Por favor, complete el formulario correctamente',
      );
      return;
    }

    this.isSubmitting.set(true);
    this.loaderService.show();

    if (this.account) {
      // Edición: solo campos editables. El saldo y la subcuenta se mueven
      // vía transferencia/movimiento (el backend rechaza esos campos por PATCH).
      const raw = this.form.getRawValue() as {
        nombre?: string | null;
        bancoId?: string | null;
        numeroCuenta?: string | null;
        observaciones?: string | null;
      };
      const dto = {
        nombre: raw.nombre ?? '',
        bancoId: raw.bancoId || undefined,
        numeroCuenta: raw.numeroCuenta ?? '',
        observaciones: raw.observaciones ?? '',
      };
      this.cuentasService.updateCuenta(this.account.id, dto).subscribe({
        next: () => {
          this.submit.emit('update');
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.notificationService.error('Error al actualizar la cuenta', err);
          this.isSubmitting.set(false);
        },
        complete: () => {
          this.loaderService.hide();
        },
      });
    } else {
      this.cuentasService.createCuenta(this.form.getRawValue()).subscribe({
        next: () => {
          this.submit.emit('create');
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.notificationService.error('Error al crear la cuenta', err);
          this.isSubmitting.set(false);
        },
        complete: () => {
          this.loaderService.hide();
        },
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
