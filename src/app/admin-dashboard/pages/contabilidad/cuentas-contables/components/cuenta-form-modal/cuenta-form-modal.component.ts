import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationService } from '@shared/services/notification.service';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import { GetCuentasContables } from '@dashboard/interfaces/catalogs-interface';

@Component({
  selector: 'app-cuenta-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-opacity-75 transition-opacity" (click)="onClose()"></div>

          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div class="inline-block align-bottom rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
            
            <!-- Header -->
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-bold text-gray-900" id="modal-title">
                {{ isEdit ? 'Editar Cuenta' : 'Agregar Subcuenta' }}
              </h3>
              <button (click)="onClose()" class="text-gray-400 hover:text-gray-500 focus:outline-none">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="px-6 py-4 space-y-4">
              
              @if (!isEdit && parentAccount) {
                <div class="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                   <p class="text-xs text-blue-700 font-medium uppercase tracking-wider mb-1">Cuenta Padre</p>
                   <p class="text-sm text-blue-900 font-bold">[{{ parentAccount.codigo }}] {{ parentAccount.nombre }}</p>
                </div>
              }

              <!-- Código -->
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-600 uppercase tracking-wider">Código PUC</label>
                <input type="text" formControlName="codigo" 
                  [readonly]="isEdit"
                  class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  [ngClass]="{'opacity-60 cursor-not-allowed': isEdit, 'border-red-300': form.get('codigo')?.invalid && form.get('codigo')?.touched}"
                >
                @if (form.get('codigo')?.errors?.['required'] && form.get('codigo')?.touched) {
                  <p class="text-[10px] text-red-500 font-medium">El código es obligatorio</p>
                }
              </div>

              <!-- Nombre -->
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-600 uppercase tracking-wider">Nombre de la Cuenta</label>
                <input type="text" formControlName="nombre" 
                  placeholder="Ej: Caja Menor"
                  class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  [ngClass]="{'border-red-300': form.get('nombre')?.invalid && form.get('nombre')?.touched}"
                >
              </div>

              <!-- Descripción -->
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-600 uppercase tracking-wider">Descripción (Opcional)</label>
                <textarea formControlName="descripcion" rows="2"
                  class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                ></textarea>
              </div>

              <!-- Checkbox: Acepta Movimiento -->
              <div class="flex items-center gap-3 py-2 px-4 bg-gray-50 rounded-lg border border-gray-100">
                <input type="checkbox" formControlName="aceptaMovimiento" id="aceptaMovimiento"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                >
                <label for="aceptaMovimiento" class="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  ¿Esta cuenta acepta movimientos contables?
                  <span class="block text-[10px] text-gray-400 font-normal mt-0.5">Marcar solo si es una cuenta auxiliar de último nivel.</span>
                </label>
              </div>

            </form>

            <!-- Footer -->
            <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              <button (click)="onClose()" type="button"
                class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button (click)="onSubmit()" [disabled]="isSubmitting()" type="button"
                class="inline-flex items-center gap-2 px-6 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
              >
                @if (isSubmitting()) {
                  <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                } @else {
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ isEdit ? 'Actualizar' : 'Crear Cuenta' }}
                }
              </button>
            </div>

          </div>
        </div>
      </div>
    }
  `
})
export class CuentaFormModalComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private cuentasService = inject(CuentasContablesService);
  private notificationService = inject(NotificationService);

  @Input() isOpen = false;
  @Input() account: GetCuentasContables | null = null;
  @Input() parentAccount: GetCuentasContables | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();

  isEdit = false;
  isSubmitting = signal(false);

  form: FormGroup = this.fb.group({
    codigo: ['', [Validators.required]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    aceptaMovimiento: [true],
    isActive: [true]
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']?.currentValue) {
      this.resetForm();
      if (this.account) {
        this.isEdit = true;
        this.form.patchValue({
          codigo: this.account.codigo,
          nombre: this.account.nombre,
          descripcion: this.account.descripcion,
          aceptaMovimiento: this.account.aceptaMovimiento,
          isActive: this.account.isActive
        });
      } else if (this.parentAccount) {
        this.isEdit = false;
        // Pre-fill code with parent prefix
        this.form.patchValue({
          codigo: this.parentAccount.codigo,
          aceptaMovimiento: true
        });
      }
    }
  }

  resetForm() {
    this.form.reset({
      aceptaMovimiento: true,
      isActive: true
    });
    this.isSubmitting.set(false);
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const dto = this.form.value;

    if (this.isEdit && this.account) {
      this.cuentasService.update(this.account.id, dto).subscribe({
        next: () => {
          this.notificationService.success('Cuenta actualizada correctamente', 'Éxito');
          this.submitForm.emit();
          this.onClose();
        },
        error: (err) => {
          this.notificationService.error('Error al actualizar', err.error?.message || 'Error desconocido');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.cuentasService.create(dto).subscribe({
        next: () => {
          this.notificationService.success('Cuenta creada correctamente', 'Éxito');
          this.submitForm.emit();
          this.onClose();
        },
        error: (err) => {
          this.notificationService.error('Error al crear', err.error?.message || 'Error desconocido');
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
