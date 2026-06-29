import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CargosService } from './services/cargos.service';
import { CargoInterface } from './interfaces/cargos.interface';
import { HeaderTitlePageComponent } from '../../../../components/header-title-page/header-title-page.component';
import { ModalComponents } from '@shared/components/modal.components/modal.components';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';

@Component({
  selector: 'app-cargos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderTitlePageComponent, ModalComponents],
  templateUrl: './cargos.component.html'
})
export class CargosComponent implements OnInit {
  private fb = inject(FormBuilder);
  public cargosService = inject(CargosService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  public isModalOpen = signal(false);
  public isEditing = signal(false);
  public currentId = signal<string | null>(null);
  
  public cargoForm: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    activo: [true]
  });

  public headTitle = signal({
    title: 'Cargos',
    slog: 'Administra los cargos y roles de tus empleados'
  });

  ngOnInit(): void {
    this.cargosService.loadCargos().subscribe();
  }

  openModal(cargo?: CargoInterface) {
    if (cargo) {
      this.isEditing.set(true);
      this.currentId.set(cargo.id);
      this.cargoForm.patchValue(cargo);
    } else {
      this.isEditing.set(false);
      this.currentId.set(null);
      this.cargoForm.reset({ activo: true });
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.cargoForm.reset();
  }

  save() {
    if (this.cargoForm.invalid) {
      this.cargoForm.markAllAsTouched();
      return;
    }

    const formValue = this.cargoForm.value;

    if (this.isEditing() && this.currentId()) {
      this.cargosService.updateCargo(this.currentId()!, formValue).subscribe({
        next: () => {
          this.toastService.success('Cargo actualizado exitosamente');
          this.closeModal();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al actualizar el cargo');
        }
      });
    } else {
      this.cargosService.createCargo(formValue).subscribe({
        next: () => {
          this.toastService.success('Cargo creado exitosamente');
          this.closeModal();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al crear el cargo');
        }
      });
    }
  }

  delete(cargo: CargoInterface) {
    this.confirmDialog.confirm({
      title: 'Eliminar Cargo',
      message: `¿Estás seguro de eliminar el cargo "${cargo.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'red',
      onConfirm: () => {
        this.cargosService.deleteCargo(cargo.id).subscribe({
          next: () => {
            this.toastService.success('Cargo eliminado exitosamente');
          },
          error: (err) => {
            this.toastService.error(err.error?.message || 'Error al eliminar el cargo');
          }
        });
      }
    });
  }
}
