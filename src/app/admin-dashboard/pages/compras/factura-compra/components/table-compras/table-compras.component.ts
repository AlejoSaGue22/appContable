import { Component, computed, input, output, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { FormsModule } from '@angular/forms';
import { UserAuth } from 'src/app/auth/interfaces/user-auth.interface';
import { InvoiceCompraStatus } from '@dashboard/interfaces/factura-compra-interface';

export interface PurchaseInvoiceFilters {
  estado?: string;
  type?: string;
  tipoFactura?: string;
  numeroFactura?: string;
  dianStatus?: string;
  providerName?: string;
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-table-compras',
  imports: [CommonModule, RouterLink, TitleCasePipe, FormsModule, PaginationComponent],
  templateUrl: './table-compras.component.html',
  standalone: true
})
export class TableComprasComponent {
  compraData = input<any[]>([]);

  activeFilters = input<PurchaseInvoiceFilters>({});
  userAuth = input<UserAuth | null>(null);
  anular = output<string>();
  delete = output<string>();
  register = output<string>();
  retryAsiento = output<string>();

  // Output events
  filterChange = output<PurchaseInvoiceFilters>();
  pageChange = output<number>();

  // Filter signals
  providerName = signal<string>('');
  status = signal<string>('');
  tipoFactura = signal<string>('');
  numeroFactura = signal<string>('');
  dianStatus = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.providerName()) count++;
    if (this.status()) count++;
    if (this.tipoFactura()) count++;
    if (this.numeroFactura()) count++;
    if (this.dianStatus()) count++;
    if (this.startDate()) count++;
    if (this.endDate()) count++;
    return count;
  });

  showFilters = signal<boolean>(false);

  constructor() {
    effect(() => {
      const filters = this.activeFilters();
      this.providerName.set(filters.providerName ?? '');
      this.status.set(filters.estado ?? '');
      this.tipoFactura.set(filters.tipoFactura ?? '');
      this.numeroFactura.set(filters.numeroFactura ?? '');
      this.dianStatus.set(filters.dianStatus ?? '');
      this.startDate.set(filters.startDate ?? '');
      this.endDate.set(filters.endDate ?? '');

      // Reshow the filters panel if any extended filter is active
      if (
        filters.estado ||
        filters.tipoFactura ||
        filters.numeroFactura ||
        filters.dianStatus ||
        filters.startDate ||
        filters.endDate
      ) {
        this.showFilters.set(true);
      }
    }, { allowSignalWrites: true });
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  readonly statuses = [
    { value: '', label: 'Todos los estados' },
    { value: InvoiceCompraStatus.REGISTRADO, label: 'Registrado' },
    { value: InvoiceCompraStatus.ERROR_ASIENTO, label: 'Error Contable' },
    { value: InvoiceCompraStatus.ANULADO, label: 'Anulado' }
  ];

  readonly tiposFactura = [
    { value: '', label: 'Todos los tipos' },
    { value: 'ELECTRONICA', label: 'Electrónica' },
    { value: 'ESTANDAR', label: 'Estándar' }
  ];

  readonly dianStatuses = [
    { value: '', label: 'Todos los estados DIAN' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'sent', label: 'Enviada' },
    { value: 'processing', label: 'Procesando' },
    { value: 'accepted', label: 'Aceptada' },
    { value: 'rejected', label: 'Rechazada' },
    { value: 'cancelled', label: 'Anulada' }
  ];

  applyFilters(): void {
    const filters: PurchaseInvoiceFilters = {};

    if (this.providerName()) filters.providerName = this.providerName();
    if (this.status()) filters.estado = this.status();
    if (this.tipoFactura()) filters.tipoFactura = this.tipoFactura();
    if (this.numeroFactura()) filters.numeroFactura = this.numeroFactura();
    if (this.dianStatus()) filters.dianStatus = this.dianStatus();
    if (this.startDate()) filters.startDate = this.startDate();
    if (this.endDate()) filters.endDate = this.endDate();

    this.filterChange.emit(filters);
  }

  onAnular(id: string): void {
    this.anular.emit(id);
  }

  onDelete(id: string): void {
    this.delete.emit(id);
  }

  onRegister(id: string): void {
    this.register.emit(id);
  }

  onRetryAsiento(id: string): void {
    this.retryAsiento.emit(id);
  }

  clearFilters(): void {
    this.providerName.set('');
    this.status.set('');
    this.tipoFactura.set('');
    this.numeroFactura.set('');
    this.dianStatus.set('');
    this.startDate.set('');
    this.endDate.set('');

    this.filterChange.emit({});
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      [InvoiceCompraStatus.REGISTRADO]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      [InvoiceCompraStatus.PAGADO]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      [InvoiceCompraStatus.ERROR_ASIENTO]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      [InvoiceCompraStatus.ANULADO]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }
}
