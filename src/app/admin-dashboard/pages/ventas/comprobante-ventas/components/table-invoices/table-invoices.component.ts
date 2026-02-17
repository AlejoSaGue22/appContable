import { Component, input, output, signal } from '@angular/core';
import { FacturaVenta, InvoiceStatus } from '@dashboard/interfaces/documento-venta-interface';
import { RouterLink } from "@angular/router";
import { FormsModule } from '@angular/forms';

export interface InvoiceFilters {
  status?: string;
  type?: string;
  clientName?: string;
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-table-invoices',
  imports: [RouterLink, FormsModule],
  templateUrl: './table-invoices.component.html',
})
export class TableInvoices {

  invoiceData = input.required<FacturaVenta[]>();

  // Pagination inputs
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  totalItems = input<number>(0);
  pageSize = input<number>(10);

  // Output events
  filterChange = output<InvoiceFilters>();
  pageChange = output<number>();

  // Filter signals
  clientName = signal<string>('');
  status = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');

  get invoiceDataArray(): FacturaVenta[] {
    const data = this.invoiceData();

    return Array.isArray(data) ? data : [data];
  }

  readonly statuses = [
    { value: '', label: 'Todos los estados' },
    { value: InvoiceStatus.DRAFT, label: 'Borrador' },
    { value: InvoiceStatus.ISSUED, label: 'Emitida' },
    { value: InvoiceStatus.PAID, label: 'Pagada' },
    { value: InvoiceStatus.CANCELLED, label: 'Cancelada' }
  ];

  applyFilters(): void {
    const filters: InvoiceFilters = {};

    if (this.clientName()) filters.clientName = this.clientName();
    if (this.status()) filters.status = this.status();
    if (this.startDate()) filters.startDate = this.startDate();
    if (this.endDate()) filters.endDate = this.endDate();

    this.filterChange.emit(filters);
  }

  clearFilters(): void {
    this.clientName.set('');
    this.status.set('');
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

  getStatusClass(status: InvoiceStatus): string {
    const classes: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [InvoiceStatus.ISSUED]: 'bg-blue-100 text-blue-800',
      [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
      [InvoiceStatus.CANCELLED]: 'bg-red-100 text-red-800'
    };
    return classes[status];
  }

  getStatusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'Borrador',
      [InvoiceStatus.ISSUED]: 'Emitida',
      [InvoiceStatus.PAID]: 'Pagada',
      [InvoiceStatus.CANCELLED]: 'Cancelada'
    };
    return labels[status];
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

}
