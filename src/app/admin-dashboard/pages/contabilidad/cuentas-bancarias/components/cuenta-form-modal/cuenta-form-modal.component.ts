import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CuentasBancariasService } from '../../../services/cuentas-bancarias.service';
import { Banco, CuentaBancaria, TipoCuentaBancaria } from '../../../interfaces/cuenta-bancaria.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { CuentasContablesService } from '../../../services/cuentas-contables.service';
import { ListGroupDropdownComponent } from '@shared/components/list-group-dropdown/list-group-dropdown.component';
import { GetCuentasContables } from '@dashboard/interfaces/catalogs-interface';

@Component({
  selector: 'app-cuenta-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ListGroupDropdownComponent],
  templateUrl: './cuenta-form-modal.component.html'
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
    saldoInicial: [0, [Validators.required, Validators.min(0)]],
    cuentaContrapartidaCodigo: [''],
    observaciones: ['', [Validators.maxLength(500)]]
  });

  bancos = signal<Banco[]>([]);
  cuentasContables = signal<GetCuentasContables[]>([]);
  tiposCuenta = Object.values(TipoCuentaBancaria);
  isSubmitting = signal(false);

  get esBanco(): boolean {
    return this.form.get('tipoCuenta')?.value === TipoCuentaBancaria.BANCO;
  }

  ngOnInit() {
    this.loadBancos();
    this.loadCuentasContables();

    this.form.get('tipoCuenta')?.valueChanges.subscribe(tipo => {
      const bancoControl = this.form.get('bancoId');
      if (tipo === TipoCuentaBancaria.BANCO) {
        bancoControl?.setValidators([Validators.required]);
      } else {
        bancoControl?.clearValidators();
        bancoControl?.setValue('');
      }
      bancoControl?.updateValueAndValidity();
    });

    if (this.account) {
      this.form.patchValue({
        nombre: this.account.nombre,
        bancoId: this.account.banco?.id || '',
        tipoCuenta: this.account.tipoCuenta,
        numeroCuenta: this.account.numeroCuenta,
        saldoInicial: this.account.saldoInicial,
        observaciones: this.account.observaciones
      });
      this.form.get('saldoInicial')?.disable();
      this.form.get('cuentaContrapartidaCodigo')?.disable();
      this.form.get('tipoCuenta')?.disable();
    }
  }

  loadBancos() {
    this.cuentasService.getBancos().subscribe({
      next: (data) => this.bancos.set(data.data),
      error: (err) => {
        this.notificationService.error('Error al cargar los bancos', err);
      }
    });
  }

  loadCuentasContables() {
    this.cuentasContablesService.getCuentasContables({ limit: 1000 }).subscribe({
      next: (res) => {
        const cuentasMovimiento = res.filter(c => c.aceptaMovimiento);
        this.cuentasContables.set(cuentasMovimiento);
      },
      error: (err) => console.error('Error cargando cuentas contables', err)
    });
  }

  onCuentaSeleccionada(cuenta: GetCuentasContables) {
    this.form.patchValue({ cuentaContrapartidaCodigo: cuenta.codigo });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Por favor, complete el formulario correctamente');
      return;
    }

    this.isSubmitting.set(true);
    this.loaderService.show();
    const dto = this.form.getRawValue();

    if (this.account) {
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
        }
      });
    } else {
      this.cuentasService.createCuenta(dto).subscribe({
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
        }
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
