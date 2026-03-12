import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PurchaseInvoiceFilters {
  status?: string;
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
  imports: [CommonModule, RouterLink, TitleCasePipe, FormsModule],
  templateUrl: './table-compras.component.html',
  standalone: true
})
export class TableComprasComponent {
  compraData = input<any[]>([]);

  // Pagination inputs
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  totalItems = input<number>(0);
  pageSize = input<number>(10);
  anular = output<string>();

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

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  readonly statuses = [
    { value: '', label: 'Todos los estados' },
    { value: 'registrado', label: 'Registrado' },
    { value: 'pagado', label: 'Pagado' },
    { value: 'error_contable', label: 'Error Contable' },
    { value: 'anulado', label: 'Anulado' }
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
    if (this.status()) filters.status = this.status();
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

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'registrado': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'pagado': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'error_contable': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'anulado': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
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
