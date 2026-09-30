import { Component, computed, input, output, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { FormsModule } from '@angular/forms';
import { UserAuth } from 'src/app/auth/interfaces/user-auth.interface';
import { DocumentoSoporte, DocumentoSoporteEstado } from '@dashboard/interfaces/documento-soporte-interface';

export interface DocumentoSoporteFilters {
  estado?: string;
  tipo?: string;
  numeroFactura?: string;
  dianStatus?: string;
  providerName?: string;
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-table-documentos-soporte',
  imports: [CommonModule, RouterLink, TitleCasePipe, FormsModule, PaginationComponent, CurrencyPipe],
  templateUrl: './table-documentos-soporte.component.html',
  standalone: true
})
export class TableDocumentosSoporteComponent {
  documentoData = input<DocumentoSoporte[]>([]);
  // Deshabilita las acciones de fila mientras el padre procesa una acción
  busy = input<boolean>(false);

  activeFilters = input<DocumentoSoporteFilters>({});
  userAuth = input<UserAuth | null>(null);
  anular = output<string>();
  delete = output<string>();
  register = output<string>();
  emitir = output<string>();
  retryAsiento = output<string>();

  // Output events
  filterChange = output<DocumentoSoporteFilters>();
  pageChange = output<number>();

  // Filter signals
  providerName = signal<string>('');
  status = signal<string>('');
  tipo = signal<string>('');
  numeroFactura = signal<string>('');
  dianStatus = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.providerName()) count++;
    if (this.status()) count++;
    if (this.tipo()) count++;
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
      this.tipo.set(filters.tipo ?? '');
      this.numeroFactura.set(filters.numeroFactura ?? '');
      this.dianStatus.set(filters.dianStatus ?? '');
      this.startDate.set(filters.startDate ?? '');
      this.endDate.set(filters.endDate ?? '');

      // Reshow the filters panel if any extended filter is active
      if (
        filters.estado ||
        filters.tipo ||
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
    { value: DocumentoSoporteEstado.REGISTRADO, label: 'Registrado' },
    { value: DocumentoSoporteEstado.ERROR_ASIENTO, label: 'Error Contable' },
    { value: DocumentoSoporteEstado.ANULADO, label: 'Anulado' }
  ];

  readonly tipos = [
    { value: '', label: 'Todos los tipos' },
    { value: 'estandar', label: 'Estándar' },
    { value: 'electronico', label: 'Electrónico' }
  ];

  readonly dianStatuses = [
    { value: '', label: 'Todos los estados DIAN' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'sent', label: 'Enviada' },
    { value: 'accepted', label: 'Aceptada' },
    { value: 'rejected', label: 'Rechazada' }
  ];

  applyFilters(): void {
    const filters: DocumentoSoporteFilters = {};

    if (this.providerName()) filters.providerName = this.providerName();
    if (this.status()) filters.estado = this.status();
    if (this.tipo()) filters.tipo = this.tipo();
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

  onEmitir(id: string): void {
    this.emitir.emit(id);
  }

  onRetryAsiento(id: string): void {
    this.retryAsiento.emit(id);
  }

  clearFilters(): void {
    this.providerName.set('');
    this.status.set('');
    this.tipo.set('');
    this.numeroFactura.set('');
    this.dianStatus.set('');
    this.startDate.set('');
    this.endDate.set('');

    this.filterChange.emit({});
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      [DocumentoSoporteEstado.REGISTRADO]: 'bg-green-50 text-green-500 dark:bg-green-500 dark:text-green-50',
      [DocumentoSoporteEstado.ERROR_ASIENTO]: 'bg-red-50 text-red-500 dark:bg-red-500 dark:text-red-50',
      [DocumentoSoporteEstado.ANULADO]: 'bg-red-50 text-red-500 dark:bg-red-500 dark:text-red-50'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getTipoClass(tipo: string): string {
    return tipo === 'electronico'
      ? 'bg-violet-50 text-violet-700 border-violet-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  }

  getDianStatusClass(status: string): string {
    const classes: Record<string, string> = {
      accepted: 'bg-green-50 text-green-600 border-green-200',
      sent: 'bg-blue-50 text-blue-600 border-blue-200',
      rejected: 'bg-red-50 text-red-600 border-red-200',
      pending: 'bg-gray-100 text-gray-500 border-gray-200'
    };
    return classes[status] || 'bg-gray-100 text-gray-500 border-gray-200';
  }

  getDianStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      accepted: 'Aceptada DIAN',
      sent: 'Enviada DIAN',
      rejected: 'Rechazada DIAN',
      pending: 'Sin enviar'
    };
    return labels[status] ?? status;
  }
}
