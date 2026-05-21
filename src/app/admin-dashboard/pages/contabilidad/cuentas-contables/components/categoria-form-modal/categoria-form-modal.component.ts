import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
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
    cuentaPrincipalId: ['', [Validators.required]],
    cuentaCostoId: [''],
    cuentaInventarioId: [''],
    manejaInventario: [false]
  });

  isSubmitting = signal(false);

  ngOnInit() {
    if (this.category) {
      this.form.patchValue({
        nombre: this.category.nombre,
        tipo: this.category.tipo,
        descripcion: this.category.descripcion,
        cuentaPrincipalId: this.category.cuentaPrincipalId || this.category.cuentaPrincipal?.id || '',
        cuentaCostoId: this.category.cuentaCostoId || this.category.cuentaCosto?.id || '',
        cuentaInventarioId: this.category.cuentaInventarioId || this.category.cuentaInventario?.id || '',
        manejaInventario: this.category.manejaInventario || false
      });
    }
  }

  onSubmit() {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        this.notificationService.error('Formulario inválido', 'Por favor, complete todos los campos obligatorios');
        return;
      }

      this.isSubmitting.set(true);
      const dto = this.form.value;

      if (this.category) {
        this.catalogsService.updateCategoryArticle(this.category.id.toString(), dto).subscribe({
          next: () => {
            this.notificationService.success('Categoría actualizada correctamente', 'Éxito');
            this.submitForm.emit();
            this.onClose();
          },
          error: (err: any) => {
            this.notificationService.error('Error al actualizar la categoría', err.error?.message || 'Error desconocido');
          }, 
          complete: () => {
            this.isSubmitting.set(false);
          }
        });
      } else {
        this.catalogsService.createCategoryArticle(dto).subscribe({
          next: () => {
            this.notificationService.success('Categoría creada correctamente', 'Éxito');
            this.submitForm.emit();
            this.onClose();
          },
          error: (err: any) => {
            this.notificationService.error('Error al crear la categoría', err.error?.message || 'Error desconocido');
          },
          complete: () => {
            this.isSubmitting.set(false);
          }
        });
      }
  }

  onClose() {
      this.close.emit();
  }
}
