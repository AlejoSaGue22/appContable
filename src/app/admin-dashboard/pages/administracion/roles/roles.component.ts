import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, tap } from 'rxjs';

import { RolesService } from '../../../services/roles.service';
import { Permission } from '../../../interfaces/permission-interface';
import { Role, CreateRoleDto, UpdateRoleDto } from '../../../interfaces/roles.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { ModalComponents } from '@shared/components/modal.components/modal.components';
import { LoaderComponent } from "@utils/components/loader/loader.component";
import { FormErrorLabelComponent } from "@utils/components/form-error-label/form-error-label.component";
import { HelpersUtils } from '@utils/helpers.utils';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponents,
    LoaderComponent,
    FormErrorLabelComponent,
    TitleCasePipe
  ],
  templateUrl: './roles.component.html',
})
export class RolesComponent {
  private rolesService = inject(RolesService);
  private notificationService = inject(NotificationService);
  private loaderService = inject(LoaderService);
  private fb = inject(FormBuilder);

  // States
  isModalOpen = signal(false);
  isDeleteModalOpen = signal(false);
  selectedRoleId = signal<string | null>(null);
  isEditing = signal(false);
  activeTab = signal<'roles' | 'permissions'>('roles');

  // Permissions list (from enum)
  allPermissions = Object.values(Permission);

  // Form
  roleForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
    permissions: [[] as string[], [Validators.required, Validators.minLength(1)]],
    isActive: [true]
  });

  // Data Resource
  rolesResource = rxResource({
    loader: () => this.rolesService.getRoles()
  });

  openCreateModal() {
    this.isEditing.set(false);
    this.selectedRoleId.set(null);
    this.roleForm.reset({ isActive: true, permissions: [] });
    this.isModalOpen.set(true);
  }

  async openEditModal(role: Role) {
    if (role.isSystem) {
      this.notificationService.warning('Los roles del sistema no pueden ser editados', 'Información');
      return;
    }

    this.isEditing.set(true);
    this.selectedRoleId.set(role.id);
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive
    });
    this.isModalOpen.set(true);
  }

  openDeleteModal(id: string, isSystem: boolean) {
    if (isSystem) {
      this.notificationService.warning('Los roles del sistema no pueden ser eliminados', 'Información');
      return;
    }
    this.selectedRoleId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  togglePermission(perm: string) {
    const currentPerms = this.roleForm.get('permissions')?.value || [];
    if (currentPerms.includes(perm)) {
      this.roleForm.patchValue({
        permissions: currentPerms.filter(p => p !== perm)
      });
    } else {
      this.roleForm.patchValue({
        permissions: [...currentPerms, perm]
      });
    }
  }

  isPermissionSelected(perm: string): boolean {
    return (this.roleForm.get('permissions')?.value || []).includes(perm);
  }

  async onSubmit() {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.loaderService.show();
    try {
      const formValue = this.roleForm.value;
      let result;

      if (this.isEditing() && this.selectedRoleId()) {
        result = await firstValueFrom(this.rolesService.updateRole(this.selectedRoleId()!, formValue as UpdateRoleDto));
      } else {
        result = await firstValueFrom(this.rolesService.createRole(formValue as CreateRoleDto));
      }

      if (result.success) {
        this.notificationService.success(
          this.isEditing() ? 'Rol actualizado correctamente' : 'Rol creado correctamente',
          'Completado'
        );
        this.isModalOpen.set(false);
        this.rolesResource.reload();
      } else {
        // this.notificationService.error(HelpersUtils.getMessageError(result.message), 'Error');
        this.notificationService.error('Error al crear el rol', 'Error');
      }
    } catch (error: any) {
      this.notificationService.error(error.message || 'Error en la operación', 'Error');
    } finally {
      this.loaderService.hide();
    }
  }

  async onDeleteConfirm() {
    const id = this.selectedRoleId();
    if (!id) return;

    this.loaderService.show();
    try {
      const result = await firstValueFrom(this.rolesService.deleteRole(id));
      if (result.success) {
        this.notificationService.success('Rol eliminado correctamente', 'Completado');
        this.isDeleteModalOpen.set(false);
        this.rolesResource.reload();
      } else {
        // this.notificationService.error(HelpersUtils.getMessageError(result.message), 'Error');
        this.notificationService.error('Error al eliminar el rol', 'Error');
      }
    } catch (error: any) {
      this.notificationService.error(error.message || 'Error al eliminar', 'Error');
    } finally {
      this.loaderService.hide();
    }
  }
}
