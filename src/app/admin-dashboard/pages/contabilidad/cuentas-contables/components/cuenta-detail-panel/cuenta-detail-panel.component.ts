import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationService } from '@shared/services/notification.service';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import { GetCuentasContables } from '@dashboard/interfaces/catalogs-interface';
import { CurrencyPipe } from '@angular/common';

export type PanelMode = 'view' | 'edit' | 'create';

@Component({
  selector: 'app-cuenta-detail-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './cuenta-detail-panel.component.html',
})
export class CuentaDetailPanelComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private cuentasService = inject(CuentasContablesService);
  private notificationService = inject(NotificationService);

  @Input() account: GetCuentasContables | null = null;
  @Input() parentAccount: GetCuentasContables | null = null;
  @Input() mode: PanelMode = 'view';

  @Output() saved = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<PanelMode>();

  isSubmitting = signal(false);

  form: FormGroup = this.fb.group({
    codigo: ['', [Validators.required]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    aceptaMovimiento: [true],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['account'] || changes['parentAccount']) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.isSubmitting.set(false);

    if (this.mode === 'edit' && this.account) {
      this.form.patchValue({
        codigo: this.account.codigo,
        nombre: this.account.nombre,
        descripcion: this.account.descripcion || '',
        aceptaMovimiento: this.account.aceptaMovimiento,
      });
    } else if (this.mode === 'create' && this.parentAccount) {
      this.form.reset({
        codigo: this.parentAccount.codigo,
        nombre: '',
        descripcion: '',
        aceptaMovimiento: true,
      });
    } else {
      this.form.reset();
    }
  }

  getTipoCuenta(nivel: number): string {
    if (nivel === 1) return 'Clase';
    if (nivel === 2) return 'Grupo';
    if (nivel === 3) return 'Cuenta';
    if (nivel === 4) return 'Subcuenta';
    return 'Auxiliar';
  }

  getDerivedLevel(codigo: string): number {
    const len = codigo.length;
    if (len === 1) return 1;
    if (len === 2) return 2;
    if (len <= 4) return 3;
    if (len <= 6) return 4;
    return 5;
  }

  switchToEdit(): void {
    this.mode = 'edit';
    this.modeChange.emit('edit');
    this.resetForm();
  }

  switchToCreate(): void {
    if (this.account) {
      this.parentAccount = this.account;
    }
    this.mode = 'create';
    this.modeChange.emit('create');
    this.resetForm();
  }

  cancelEdit(): void {
    this.mode = 'view';
    this.modeChange.emit('view');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const dto = this.form.value;

    if (this.mode === 'edit' && this.account) {
      this.cuentasService.update(this.account.id, dto).subscribe({
        next: () => {
          this.notificationService.success('Cuenta actualizada correctamente', 'Éxito');
          this.mode = 'view';
          this.modeChange.emit('view');
          this.saved.emit();
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Error al actualizar', 'Error');
          this.isSubmitting.set(false);
        }
      });
    } else if (this.mode === 'create') {
      this.cuentasService.create(dto).subscribe({
        next: () => {
          this.notificationService.success('Cuenta creada correctamente', 'Éxito');
          this.mode = 'view';
          this.modeChange.emit('view');
          this.saved.emit();
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Error al crear', 'Error');
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
