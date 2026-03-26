import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogsService } from '../../../../../services/catalogs.service';
import { CategoryArticle, GetCuentasContables } from '../../../../../interfaces/catalogs-interface';
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-categoria-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './categoria-form-modal.component.html'
})
export class CategoriaFormModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private catalogsService = inject(CatalogsService);
  private notificationService = inject(NotificationService);

  @Input() isOpen = false;
  @Input() category: CategoryArticle | null = null;
  @Input() cuentasList: GetCuentasContables[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();

  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    tipo: ['PRODUCTO', [Validators.required]],
    descripcion: ['', [Validators.maxLength(255)]],
    cuentaContableId: ['', [Validators.required]],
    cuentaIvaId: ['', [Validators.required]]
  });

  isSubmitting = signal(false);

  ngOnInit() {
    if (this.category) {
      this.form.patchValue({
        nombre: this.category.nombre,
        tipo: this.category.tipo,
        descripcion: this.category.descripcion,
        cuentaContableId: this.category.cuentaContableId || this.category.cuentaContable?.id || '',
        cuentaIvaId: this.category.cuentaIvaId || this.category.cuentaIva?.id || ''
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const dto = this.form.value;

    if (this.category) {
      this.catalogsService.updateCategoryArticle(this.category.id.toString(), dto).subscribe({
        next: () => {
          this.notificationService.success('Categoría actualizada correctamente', 'Éxito');
          this.submitForm.emit();
          this.isSubmitting.set(false);
          this.onClose();
        },
        error: (err: any) => {
          this.notificationService.error('Error al actualizar la categoría', err.error?.message || 'Error desconocido');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.catalogsService.createCategoryArticle(dto).subscribe({
        next: () => {
          this.notificationService.success('Categoría creada correctamente', 'Éxito');
          this.submitForm.emit();
          this.isSubmitting.set(false);
          this.onClose();
        },
        error: (err: any) => {
          this.notificationService.error('Error al crear la categoría', err.error?.message || 'Error desconocido');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
