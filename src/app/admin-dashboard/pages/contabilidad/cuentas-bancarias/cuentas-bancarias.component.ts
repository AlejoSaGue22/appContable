import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';

import { CuentasBancariasService } from '../services/cuentas-bancarias.service';
import { LoaderComponent } from '@utils/components/loader/loader.component';
import {
  HeaderInput,
  HeaderTitlePageComponent,
} from '@dashboard/components/header-title-page/header-title-page.component';
import { CuentaBancaria } from '../interfaces/cuenta-bancaria.interface';

import { CuentaFormModalComponent } from './components/cuenta-form-modal/cuenta-form-modal.component';
import { TransferenciaModalComponent } from './components/transferencia-modal/transferencia-modal.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { tap } from 'rxjs';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { TableBancoComponent } from './components/table-banco/table-banco.component';

@Component({
  selector: 'app-cuentas-bancarias',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    CurrencyPipe,
    CuentaFormModalComponent,
    TransferenciaModalComponent,
    HeaderTitlePageComponent,
    ModalComponent,
    PaginationComponent,
    TableBancoComponent,
  ],
  templateUrl: './cuentas-bancarias.component.html',
})
export default class CuentasBancariasComponent {
  private cuentasService = inject(CuentasBancariasService);
  private paginationService = inject(PaginationService);
  private notificationService = inject(NotificationService);
  private loaderService = inject(LoaderService);

  headTitle: HeaderInput = {
    title: 'Cuentas Bancarias',
    slog: 'Gestión centralizada de recursos financieros',
  };

  isModalOpen = signal(false);
  isTransferenciaModalOpen = signal(false);
  selectedAccount = signal<CuentaBancaria | null>(null);
  isDeleteModalVisible = signal(false);
  idToDelete = signal<string | null>(null);

  cuentasResource = rxResource({
    request: () => ({
      offset: this.paginationService.currentPage(),
      limit: 10,
      estado: 'todos' as const,
    }),
    loader: ({ request }) =>
      this.cuentasService.getCuentasBancos(request).pipe(
        tap((res) => {
          const size = Math.ceil(res.count / request.limit);
          this.paginationService.totalItems.set(res.count);
          this.paginationService.pageSize.set(size);
        }),
      ),
  });

  cuentas = computed(() => this.cuentasResource.value()?.cuentas ?? []);

  openCreateModal() {
    this.selectedAccount.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(cuenta: CuentaBancaria) {
    this.selectedAccount.set(cuenta);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedAccount.set(null);
  }

  onFormSubmit(action: 'create' | 'update') {
    this.closeModal();
    const message =
      action === 'create'
        ? 'Cuenta creada correctamente'
        : 'Cuenta actualizada correctamente';
    this.notificationService.success(message);
    this.cuentasResource.reload();
  }

  openTransferenciaModal() {
    this.isTransferenciaModalOpen.set(true);
  }

  closeTransferenciaModal() {
    this.isTransferenciaModalOpen.set(false);
  }

  onTransferenciaSubmit() {
    this.closeTransferenciaModal();
    this.notificationService.success('Transferencia realizada correctamente');
    this.cuentasResource.reload();
  }

  deleteCuenta(id: string) {
    this.idToDelete.set(id);
    this.isDeleteModalVisible.set(true);
  }

  confirmDelete() {
    const id = this.idToDelete();
    if (!id) return;

    this.loaderService.show();

    this.cuentasService.deleteCuenta(id).subscribe({
      next: () => {
        this.cuentasResource.reload();
        this.isDeleteModalVisible.set(false);
        this.idToDelete.set(null);
        this.notificationService.success('Cuenta eliminada correctamente');
      },
      error: (err) => {
        console.log(err);
        this.loaderService.hide();
        this.notificationService.error(
          err.error.message,
          'Error al eliminar la cuenta',
        );
      },
      complete: () => {
        this.loaderService.hide();
      },
    });
  }

  onToggleStatus(id: string) {
    this.loaderService.show();
    this.cuentasService.toggleStatus(id).subscribe({
      next: () => {
        this.cuentasResource.reload();
        this.notificationService.success('Estado actualizado correctamente');
      },
      error: (err) => {
        console.error(err);
        this.notificationService.error(
          err.error?.message || 'Ocurrió un error',
          'Error al actualizar el estado',
        );
      },
      complete: () => {
        this.loaderService.hide();
      },
    });
  }
}
