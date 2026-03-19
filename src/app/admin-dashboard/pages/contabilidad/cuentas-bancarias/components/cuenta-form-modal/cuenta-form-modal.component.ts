import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CuentasBancariasService } from '../../../services/cuentas-bancarias.service';
import { Banco, CuentaBancaria, TipoCuentaBancaria } from '../../../interfaces/cuenta-bancaria.interface';

@Component({
  selector: 'app-cuenta-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cuenta-form-modal.component.html'
})
export class CuentaFormModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cuentasService = inject(CuentasBancariasService);

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
      error: (err) => console.error('Error loading banks', err)
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const dto = this.form.getRawValue();

    if (this.account) {
      this.cuentasService.updateCuenta(this.account.id, dto).subscribe({
        next: () => {
          this.submit.emit();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Error updating account', err);
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.cuentasService.createCuenta(dto).subscribe({
        next: () => {
          this.submit.emit();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Error creating account', err);
          this.isSubmitting.set(false);
        }
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
