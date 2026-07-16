import { Component, EventEmitter, OnInit, Output, computed, inject, signal, input, effect } from '@angular/core';
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
export class CategoriaFormModalComponent {
 private fb = inject(FormBuilder);
 private catalogsService = inject(CatalogsService);
 private notificationService = inject(NotificationService);

 isOpen = input<boolean>(false);
 category = input<CategoryArticle | null>(null);
 cuentasList = input<GetCuentasContables[]>([]);
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
 cuentaPrincipal = computed(() => this.cuentasList().filter((cuenta) => 
 cuenta.aceptaMovimiento ));
 cuentaCosto = computed(() => this.cuentasList().filter((cuenta) => 
 cuenta.aceptaMovimiento ));
 cuentaInventario = computed(() => this.cuentasList().filter((cuenta) => 
 cuenta.aceptaMovimiento ));

 constructor() {
  effect(() => {
    const cat = this.category();
    if (cat) {
      this.form.patchValue({
        nombre: cat.nombre,
        tipo: cat.tipo.toUpperCase(),
        descripcion: cat.descripcion,
        cuentaPrincipalId: cat.cuentaPrincipalId ? String(cat.cuentaPrincipalId) : (cat.cuentaPrincipal?.id ? String(cat.cuentaPrincipal?.id) : ''),
        cuentaCostoId: cat.cuentaCostoId ? String(cat.cuentaCostoId) : (cat.cuentaCosto?.id ? String(cat.cuentaCosto?.id) : ''),
        cuentaInventarioId: cat.cuentaInventarioId ? String(cat.cuentaInventarioId) : (cat.cuentaInventario?.id ? String(cat.cuentaInventario?.id) : ''),
        manejaInventario: cat.manejaInventario || false
      });
    } else {
      this.form.reset({
        nombre: '',
        tipo: 'PRODUCTO',
        descripcion: '',
        cuentaPrincipalId: '',
        cuentaCostoId: '',
        cuentaInventarioId: '',
        manejaInventario: false
      });
    }
  });
 }

 onSubmit() {
 if (this.form.invalid) {
 this.form.markAllAsTouched();
 this.notificationService.error('Formulario inválido', 'Por favor, complete todos los campos obligatorios');
 return;
 }

 this.isSubmitting.set(true);
 const dto = this.form.value;

 if (this.category()) {
 this.catalogsService.updateCategoryArticle(this.category()!.id.toString(), dto).subscribe({
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
