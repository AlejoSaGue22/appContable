import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CuentasBancariasService } from '../../../services/cuentas-bancarias.service';
import { Banco, CuentaBancaria, TipoCuentaBancaria } from '../../../interfaces/cuenta-bancaria.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
  selector: 'app-cuenta-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cuenta-form-modal.component.html'
})
export class CuentaFormModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cuentasService = inject(CuentasBancariasService);
  private notificationService = inject(NotificationService);
  private loaderService = inject(LoaderService);

  @Input() isOpen = false;
  @Input() account: CuentaBancaria | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    bancoId: ['', [Validators.required]],
    tipoCuenta: [TipoCuentaBancaria.AHORROS, [Validators.required]],
    numeroCuenta: ['', [Validators.maxLength(30)]],
    // saldoInicial: [0, [Validators.required, Validators.min(0)]],
    observaciones: ['', [Validators.maxLength(500)]]
  });

  bancos = signal<Banco[]>([]);
  tiposCuenta = Object.values(TipoCuentaBancaria);
  isSubmitting = signal(false);

  ngOnInit() {
    this.loadBancos();
    if (this.account) {
      this.form.patchValue({
        nombre: this.account.nombre,
        bancoId: this.account.banco.id,
        tipoCuenta: this.account.tipoCuenta,
        numeroCuenta: this.account.numeroCuenta,
        // saldoInicial: this.account.saldoInicial,
        observaciones: this.account.observaciones
      });
      // Saldo inicial might be disabled if editing (depends on backend logic)
      // this.form.get('saldoInicial')?.disable();
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
          this.submit.emit();
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
          this.submit.emit();
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
