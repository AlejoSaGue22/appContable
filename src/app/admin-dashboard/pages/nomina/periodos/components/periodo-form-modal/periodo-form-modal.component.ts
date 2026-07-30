import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NominaService } from '../../../services/nomina.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
  selector: 'app-periodo-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './periodo-form-modal.component.html',
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
      },
    });
  }

  onClose() {
    this.close.emit();
  }
}
