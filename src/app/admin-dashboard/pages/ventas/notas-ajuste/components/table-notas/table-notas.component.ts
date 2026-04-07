import { Component, computed, input, output, signal, effect } from '@angular/core';
import { RouterLink } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { NotaAjuste, NotaAjusteStatus, ConceptosNotaCredito, ConceptosNotaDebito } from '../../../../../interfaces/notas-ajuste-interface';

export interface NotaFilters {
  tipo?: string;
  estado?: string;
  facturaNumero?: string;
  clienteNombre?: string;
}

@Component({
  selector: 'app-table-notas',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginationComponent],
  templateUrl: './table-notas.component.html',
})
export class TableNotasComponent {

  notaData = input.required<NotaAjuste[]>();
  activeFilters = input<NotaFilters>({});

  // Pagination inputs
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  totalItems = input<number>(0);
  pageSize = input<number>(10);

  // Output events
  filterChange = output<NotaFilters>();
  pageChange = output<number>();
  emitir = output<string>();
  anular = output<string>();
  delete = output<string>();
  downloadPDF = output<string>();
  downloadXML = output<string>();

  // Filter signals
  clienteNombre = signal<string>('');
  estado = signal<string>('');
  tipo = signal<string>('');
  facturaNumero = signal<string>('');

  activeFiltersCount = computed(() => {
    let count = 0;
      if (this.clienteNombre()) count++;
      if (this.estado()) count++;
      if (this.tipo()) count++;
      if (this.facturaNumero()) count++;
    return count;
  });

  showFilters = signal<boolean>(false);

  constructor() {
    effect(() => {
      const filters = this.activeFilters();
      this.clienteNombre.set(filters.clienteNombre ?? '');
      this.estado.set(filters.estado ?? '');
      this.tipo.set(filters.tipo ?? '');
      this.facturaNumero.set(filters.facturaNumero ?? '');

      if (filters.estado || filters.tipo || filters.facturaNumero) {
        this.showFilters.set(true);
      }
    }, { allowSignalWrites: true });
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  get notaDataArray(): NotaAjuste[] {
    const data = this.notaData();
    return Array.isArray(data) ? data : [data];
  }

  readonly estados = [
    { value: '', label: 'Todos los estados' },
    { value: NotaAjusteStatus.DRAFT, label: 'Borrador' },
    { value: NotaAjusteStatus.SENT, label: 'Enviada' },
    { value: NotaAjusteStatus.ACCEPTED, label: 'Aceptada' },
    { value: NotaAjusteStatus.REJECTED, label: 'Rechazada' },
    { value: NotaAjusteStatus.CANCELLED, label: 'Anulada' }
  ];

  readonly tipos = [
    { value: '', label: 'Todos los tipos' },
    { value: 'CREDITO', label: 'Nota Crédito' },
    { value: 'DEBITO', label: 'Nota Débito' }
  ];

  applyFilters(): void {
    const filters: NotaFilters = {};
    if (this.clienteNombre()) filters.clienteNombre = this.clienteNombre();
    if (this.estado()) filters.estado = this.estado();
    if (this.tipo()) filters.tipo = this.tipo();
    if (this.facturaNumero()) filters.facturaNumero = this.facturaNumero();
    this.filterChange.emit(filters);
  }

  clearFilters(): void {
    this.clienteNombre.set('');
    this.estado.set('');
    this.tipo.set('');
    this.facturaNumero.set('');
    this.filterChange.emit({});
  }

  getStatusClass(status: NotaAjusteStatus): string {
    const classes: Record<NotaAjusteStatus, string> = {
      [NotaAjusteStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [NotaAjusteStatus.SENT]: 'bg-yellow-100 text-yellow-800',
      [NotaAjusteStatus.ACCEPTED]: 'bg-green-100 text-green-800',
      [NotaAjusteStatus.REJECTED]: 'bg-red-100 text-red-800',
      [NotaAjusteStatus.CANCELLED]: 'bg-gray-500 text-white'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: NotaAjusteStatus): string {
    const labels: Record<NotaAjusteStatus, string> = {
      [NotaAjusteStatus.DRAFT]: 'Borrador',
      [NotaAjusteStatus.SENT]: 'Enviada',
      [NotaAjusteStatus.ACCEPTED]: 'Aceptada',
      [NotaAjusteStatus.REJECTED]: 'Rechazada',
      [NotaAjusteStatus.CANCELLED]: 'Anulada'
    };
    return labels[status] || status;
  }

  getConceptoLabel(tipo: string, concepto: string): string {
    const list = tipo === 'CREDITO' ? ConceptosNotaCredito : ConceptosNotaDebito;
    return list.find(c => c.value === concepto)?.label || concepto;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  onEmitir(id: string): void {
    this.emitir.emit(id);
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
