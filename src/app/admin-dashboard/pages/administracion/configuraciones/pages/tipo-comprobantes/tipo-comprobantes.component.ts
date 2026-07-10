import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TipoComprobanteService } from './services/tipo-comprobante.service';
import { TipoComprobanteInterface } from './interfaces/tipo-comprobante.interface';
import { ModalComponents } from '@shared/components/modal.components/modal.components';
import { NotificationService } from '@shared/services/notification.service';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-tipo-comprobantes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderTitlePageComponent,
    ModalComponents,
    BreadcrumbComponent,
  ],
  templateUrl: './tipo-comprobantes.component.html',
})
export class TipoComprobantesComponent implements OnInit {
  private fb = inject(FormBuilder);
  public service = inject(TipoComprobanteService);
  private toastService = inject(NotificationService);

  public isModalOpen = signal(false);
  public isEditing = signal(false);
  public currentId = signal<string | null>(null);

  public form: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(10)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    prefijo: ['', [Validators.maxLength(10)]],
    consecutivoActual: [1, [Validators.required, Validators.min(1)]],
    numeracionAutomatica: [true],
    activo: [true],
    requiereAprobacion: [false],
    docReferenciaObligatorio: [false],
  });

  public headTitle = signal({
    title: 'Tipos de Comprobantes',
    slog: 'Administra y parametriza los tipos de comprobantes contables de tu empresa',
  });

  breadcrumbItems = [
    { label: 'Configuración', route: '/panel/admin/settings' },
    { label: 'Tipos de Comprobantes' },
  ];

  ngOnInit(): void {
    this.service.loadTipos().subscribe();
  }

  openModal(tipo?: TipoComprobanteInterface) {
    if (tipo) {
      this.isEditing.set(true);
      this.currentId.set(tipo.id);
      this.form.patchValue(tipo);
      this.form.get('codigo')?.disable(); // No se puede editar el código una vez creado
    } else {
      this.isEditing.set(false);
      this.currentId.set(null);
      this.form.reset({
        consecutivoActual: 1,
        numeracionAutomatica: true,
        activo: true,
        requiereAprobacion: false,
        docReferenciaObligatorio: false,
      });
      this.form.get('codigo')?.enable();
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.form.reset();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.isEditing() && this.currentId()) {
      this.service
        .updateTipo(this.currentId()!, formValue)
        .subscribe({
          next: () => {
            this.toastService.success('Tipo de comprobante actualizado exitosamente');
            this.closeModal();
          },
          error: (err) => {
            this.toastService.error(
              err.error?.message || 'Error al actualizar el tipo de comprobante',
            );
          },
        });
    } else {
      this.service.createTipo(formValue).subscribe({
        next: () => {
          this.toastService.success('Tipo de comprobante creado exitosamente');
          this.closeModal();
        },
        error: (err) => {
          this.toastService.error(
            err.error?.message || 'Error al crear el tipo de comprobante',
          );
        },
      });
    }
  }
}
