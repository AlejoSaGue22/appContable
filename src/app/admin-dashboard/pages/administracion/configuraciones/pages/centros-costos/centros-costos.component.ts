import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CentrosCostosService } from './services/centros-costos.service';
import { CentroCostoInterface } from './interfaces/centros-costos.interface';
import { HeaderTitlePageComponent } from '../../../../components/header-title-page/header-title-page.component';
import { ModalComponents } from '@shared/components/modal.components/modal.components';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';

@Component({
  selector: 'app-centros-costos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderTitlePageComponent, ModalComponents],
  templateUrl: './centros-costos.component.html'
})
export class CentrosCostosComponent implements OnInit {
  private fb = inject(FormBuilder);
  public centrosCostosService = inject(CentrosCostosService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  public isModalOpen = signal(false);
  public isEditing = signal(false);
  public currentId = signal<string | null>(null);
  
  public centroCostoForm: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    activo: [true]
  });

  public headTitle = signal({
    title: 'Centros de Costos',
    slog: 'Administra los centros de costos de tu empresa'
  });

  ngOnInit(): void {
    this.centrosCostosService.loadCentrosCostos().subscribe();
  }

  openModal(centroCosto?: CentroCostoInterface) {
    if (centroCosto) {
      this.isEditing.set(true);
      this.currentId.set(centroCosto.id);
      this.centroCostoForm.patchValue(centroCosto);
    } else {
      this.isEditing.set(false);
      this.currentId.set(null);
      this.centroCostoForm.reset({ activo: true });
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.centroCostoForm.reset();
  }

  save() {
    if (this.centroCostoForm.invalid) {
      this.centroCostoForm.markAllAsTouched();
      return;
    }

    const formValue = this.centroCostoForm.value;

    if (this.isEditing() && this.currentId()) {
      this.centrosCostosService.updateCentroCosto(this.currentId()!, formValue).subscribe({
        next: () => {
          this.toastService.success('Centro de costo actualizado exitosamente');
          this.closeModal();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al actualizar el centro de costo');
        }
      });
    } else {
      this.centrosCostosService.createCentroCosto(formValue).subscribe({
        next: () => {
          this.toastService.success('Centro de costo creado exitosamente');
          this.closeModal();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al crear el centro de costo');
        }
      });
    }
  }

  delete(centroCosto: CentroCostoInterface) {
    this.confirmDialog.confirm({
      title: 'Eliminar Centro de Costo',
      message: `¿Estás seguro de eliminar el centro de costo "${centroCosto.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'red',
      onConfirm: () => {
        this.centrosCostosService.deleteCentroCosto(centroCosto.id).subscribe({
          next: () => {
            this.toastService.success('Centro de costo eliminado exitosamente');
          },
          error: (err) => {
            this.toastService.error(err.error?.message || 'Error al eliminar el centro de costo');
          }
        });
      }
    });
  }
}
