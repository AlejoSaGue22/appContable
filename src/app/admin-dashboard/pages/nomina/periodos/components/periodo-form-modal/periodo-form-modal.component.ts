import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NominaService } from '../../../services/nomina.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
    selector: 'app-periodo-form-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-xl font-bold">Nuevo Período de Nómina</h3>
          <button (click)="onClose()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre <span class="text-red-500">*</span></label>
            <input type="text" formControlName="nombre" placeholder="Ej: Quincena 1 - Julio 2026" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Inicio <span class="text-red-500">*</span></label>
              <input type="date" formControlName="fechaInicio" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Fin <span class="text-red-500">*</span></label>
              <input type="date" formControlName="fechaFin" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo <span class="text-red-500">*</span></label>
              <select formControlName="tipo" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
                <option value="MENSUAL">Mensual</option>
                <option value="QUINCENAL">Quincenal</option>
                <option value="SEMANAL">Semanal</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Pago</label>
              <input type="date" formControlName="fechaPago" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
            </div>
          </div>

          <div class="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" (click)="onClose()" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" [disabled]="form.invalid || isSubmitting()" class="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
              Crear Período
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PeriodoFormModalComponent {
    private fb = inject(FormBuilder);
    private nominaService = inject(NominaService);
    private notification = inject(NotificationService);
    private loader = inject(LoaderService);

    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();

    form: FormGroup = this.fb.group({
        nombre: ['', Validators.required],
        fechaInicio: ['', Validators.required],
        fechaFin: ['', Validators.required],
        tipo: ['MENSUAL', Validators.required],
        fechaPago: [''],
    });

    isSubmitting = signal(false);

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.notification.error('Complete el formulario correctamente');
            return;
        }
        this.isSubmitting.set(true);
        this.loader.show();
        this.nominaService.createPeriodo(this.form.value).subscribe({
            next: () => {
                this.notification.success('Período creado exitosamente');
                this.saved.emit();
                this.isSubmitting.set(false);
                this.loader.hide();
            },
            error: (err) => {
                this.notification.error('Error al crear período', err);
                this.isSubmitting.set(false);
                this.loader.hide();
            }
        });
    }

    onClose() {
        this.close.emit();
    }
}
