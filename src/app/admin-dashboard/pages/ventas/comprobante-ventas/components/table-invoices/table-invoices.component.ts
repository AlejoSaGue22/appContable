import { Component, computed, input, output, signal, effect } from '@angular/core';
import { FacturaVenta, GetFacturaRequest, InvoiceStatus } from '@dashboard/interfaces/documento-venta-interface';
import { RouterLink } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '@shared/components/pagination/pagination';

export interface InvoiceFilters {
  status?: string;
  type?: string;
  tipoFactura?: string;
  numeroFactura?: string;
  dianStatus?: string;
  clientName?: string;
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-table-invoices',
  imports: [RouterLink, FormsModule, PaginationComponent],
  templateUrl: './table-invoices.component.html',
})
export class TableInvoices {

  invoiceData = input.required<GetFacturaRequest[]>();

  // Input for active filters to restore state if component is recreated
  activeFilters = input<InvoiceFilters>({});

  // Pagination inputs
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  totalItems = input<number>(0);
  pageSize = input<number>(10);

  // Output events
  filterChange = output<InvoiceFilters>();
  pageChange = output<number>();
  emitir = output<string>();
  anular = output<string>();
  retry = output<string>();
  delete = output<string>();
  downloadPDF = output<string>();
  downloadXML = output<string>();

  // Filter signals
  clientName = signal<string>('');
  status = signal<string>('');
  tipoFactura = signal<string>('');
  numeroFactura = signal<string>('');
  dianStatus = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.clientName()) count++;
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
      this.clientName.set(filters.clientName ?? '');
      this.status.set(filters.status ?? '');
      this.tipoFactura.set(filters.tipoFactura ?? '');
      this.numeroFactura.set(filters.numeroFactura ?? '');
      this.dianStatus.set(filters.dianStatus ?? '');
      this.startDate.set(filters.startDate ?? '');
      this.endDate.set(filters.endDate ?? '');

      // Show filters panel if any extended filter is active
      if (
        filters.status ||
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

  get invoiceDataArray(): GetFacturaRequest[] {
    const data = this.invoiceData();

    return Array.isArray(data) ? data : [data];
  }

  readonly statuses = [
    { value: '', label: 'Todos los estados' },
    { value: InvoiceStatus.DRAFT, label: 'Borrador' },
    { value: InvoiceStatus.PENDING_DIAN, label: 'Pendiente DIAN' },
    { value: InvoiceStatus.ACCEPTED, label: 'Aceptada' },
    { value: InvoiceStatus.REJECTED, label: 'Rechazada' },
    { value: InvoiceStatus.PAID, label: 'Pagada' },
    { value: InvoiceStatus.CANCELLED, label: 'Cancelada' },
    { value: InvoiceStatus.ISSUED, label: 'Emitida' },
    { value: InvoiceStatus.ERROR_ASIENTO, label: 'Error Asiento' }
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
    const filters: InvoiceFilters = {};

    if (this.clientName()) filters.clientName = this.clientName();
    if (this.status()) filters.status = this.status();
    if (this.tipoFactura()) filters.tipoFactura = this.tipoFactura();
    if (this.numeroFactura()) filters.numeroFactura = this.numeroFactura();
    if (this.dianStatus()) filters.dianStatus = this.dianStatus();
    if (this.startDate()) filters.startDate = this.startDate();
    if (this.endDate()) filters.endDate = this.endDate();

    this.filterChange.emit(filters);
  }

  clearFilters(): void {
    this.clientName.set('');
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

  getStatusClass(status: InvoiceStatus): string {
    const classes: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [InvoiceStatus.PENDING_DIAN]: 'bg-yellow-100 text-yellow-800',
      [InvoiceStatus.ACCEPTED]: 'bg-green-100 text-green-800',
      [InvoiceStatus.REJECTED]: 'bg-red-100 text-red-800',
      [InvoiceStatus.PAID]: 'bg-blue-100 text-blue-800',
      [InvoiceStatus.CANCELLED]: 'bg-gray-500 text-gray-800',
      [InvoiceStatus.ISSUED]: 'bg-blue-100 text-blue-800',
      [InvoiceStatus.ERROR_ASIENTO]: 'bg-red-100 text-red-800'
    };
    return classes[status];
  }

  getStatusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'Borrador',
      [InvoiceStatus.PENDING_DIAN]: 'Pendiente DIAN',
      [InvoiceStatus.ACCEPTED]: 'Aceptada',
      [InvoiceStatus.REJECTED]: 'Rechazada',
      [InvoiceStatus.PAID]: 'Pagada',
      [InvoiceStatus.CANCELLED]: 'Cancelada',
      [InvoiceStatus.ISSUED]: 'Emitida',
      [InvoiceStatus.ERROR_ASIENTO]: 'Error Asiento'
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

  onEmitir(id: string): void {
    this.emitir.emit(id);
  }

  onRetry(id: string): void {
    this.retry.emit(id);
  }

  onAnular(id: string): void {
    this.anular.emit(id);
  }

  onDelete(id: string): void {
    this.delete.emit(id);
  }

  onDownloadPDF(id: string): void {
    this.downloadPDF.emit(id);
  }

  onDownloadXML(id: string): void {
    this.downloadXML.emit(id);
  }

}
