import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';

import { CuentasBancariasService } from '../services/cuentas-bancarias.service';
import { LoaderComponent } from '@utils/components/loader/loader.component';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CuentaBancaria } from '../interfaces/cuenta-bancaria.interface';

import { CuentaFormModalComponent } from './components/cuenta-form-modal/cuenta-form-modal.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-cuentas-bancarias',
  standalone: true,
  imports: [CommonModule, LoaderComponent, CurrencyPipe, CuentaFormModalComponent, HeaderTitlePageComponent, ModalComponent],
  templateUrl: './cuentas-bancarias.component.html'
})
export default class CuentasBancariasComponent {
  private cuentasService = inject(CuentasBancariasService);

  headTitle: HeaderInput = {
    title: 'Cuentas Bancarias',
    slog: 'Gestión centralizada de recursos financieros'
  }


  // Modal control
  isModalOpen = signal(false);
  selectedAccount = signal<CuentaBancaria | null>(null);

  // Modal de eliminación
  isDeleteModalVisible = signal(false);
  idToDelete = signal<string | null>(null);

  cuentasResource = rxResource({
    loader: () => this.cuentasService.getCuentas()
  });

  cuentas = computed(() => this.cuentasResource.value()?.data ?? []);

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
    this.cuentasService.toggleStatus(id).subscribe({
      next: () => this.cuentasResource.reload(),
      error: (err) => {}
    });

  }

  deleteCuenta(id: string) {
    this.idToDelete.set(id);
    this.isDeleteModalVisible.set(true);
  }

  confirmDelete() {
    const id = this.idToDelete();
    if (!id) return;

    this.cuentasService.deleteCuenta(id).subscribe({
      next: () => {
        this.cuentasResource.reload();
        this.isDeleteModalVisible.set(false);
        this.idToDelete.set(null);
      },
      error: (err) => {}
    });
  }
}
