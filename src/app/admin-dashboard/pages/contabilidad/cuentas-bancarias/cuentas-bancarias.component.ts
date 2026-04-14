import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';

import { CuentasBancariasService } from '../services/cuentas-bancarias.service';
import { LoaderComponent } from '@utils/components/loader/loader.component';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CuentaBancaria } from '../interfaces/cuenta-bancaria.interface';

import { CuentaFormModalComponent } from './components/cuenta-form-modal/cuenta-form-modal.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { tap } from 'rxjs';
import { PaginationComponent } from "@shared/components/pagination/pagination";
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
  selector: 'app-cuentas-bancarias',
  standalone: true,
  imports: [CommonModule, LoaderComponent, CurrencyPipe, CuentaFormModalComponent, HeaderTitlePageComponent, ModalComponent, PaginationComponent],
  templateUrl: './cuentas-bancarias.component.html'
})
export default class CuentasBancariasComponent {
  private cuentasService = inject(CuentasBancariasService);
  private paginationService = inject(PaginationService);
  private notificationService = inject(NotificationService);
  private loaderService = inject(LoaderService);

  headTitle: HeaderInput = {
    title: 'Cuentas Bancarias',
    slog: 'Gestión centralizada de recursos financieros'
  }

  isModalOpen = signal(false);
  selectedAccount = signal<CuentaBancaria | null>(null);
  isDeleteModalVisible = signal(false);
  idToDelete = signal<string | null>(null);

  cuentasResource = rxResource({
    request: () => ({
      offset: this.paginationService.currentPage() - 1,
      limit: 10,
    }),
    loader: ({ request }) => this.cuentasService.getCuentas(request).pipe(
      tap((res) => {
        const size = Math.ceil(res.count / request.limit);
        this.paginationService.totalItems.set(res.count);
        this.paginationService.pageSize.set(size);
      })
    )
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

  onFormSubmit() {
    this.closeModal();
    this.cuentasResource.reload();
  }

  toggleStatus(id: string) {
    this.loaderService.show();
    this.cuentasService.toggleStatus(id).subscribe({
      next: () => this.cuentasResource.reload(),
      error: (err) => {
        this.notificationService.error('Error al cambiar el estado de la cuenta', err);
      },
      complete: () => {
        this.loaderService.hide();
      }
    });

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
      },
      error: (err) => {
        this.notificationService.error('Error al eliminar la cuenta', err);
      },
      complete: () => {
        this.loaderService.hide();
      }
    });
  }
}
