import { Component, computed, input, output, signal, effect, inject } from '@angular/core';
import { RouterLink } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { NotaAjusteCompra, NotaAjusteCompraStatus } from '../../../../../interfaces/notas-ajuste-compra-interface';
import { CurrencyPipe } from '@angular/common';

export interface NotaComprasFilters {
  tipo?: string;
  estado?: string;
  facturaNumero?: string;
  proveedorNombre?: string;
}

@Component({
  selector: 'app-table-notas-compras',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginationComponent, CurrencyPipe],
  templateUrl: './table-notas.component.html',
})
export class TableNotasComprasComponent {

  notas = input.required<NotaAjusteCompra[]>();
  activeFilters = input<NotaComprasFilters>({});

  // Output events
  filterChange = output<NotaComprasFilters>();
  pageChange = output<number>();
  registrarBorrador = output<string>();
  anular = output<string>();
  delete = output<string>();
  reintentarAsiento = output<string>();

  // Filter signals
  proveedorNombre = signal<string>('');
  estado = signal<string>('');
  tipo = signal<string>('');
  facturaNumero = signal<string>('');

  activeFiltersCount = computed(() => {
    let count = 0;
      if (this.proveedorNombre()) count++;
      if (this.estado()) count++;
      if (this.tipo()) count++;
      if (this.facturaNumero()) count++;
    return count;
  });

  showFilters = signal<boolean>(false);

  constructor() {
    effect(() => {
      const filters = this.activeFilters();
      this.proveedorNombre.set(filters.proveedorNombre ?? '');
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

  get notaDataArray(): NotaAjusteCompra[] {
    const data = this.notas();
    return Array.isArray(data) ? data : [data];
  }

  readonly estados = [
    { value: '', label: 'Todos los estados' },
    { value: NotaAjusteCompraStatus.DRAFT, label: 'Borrador' },
    { value: NotaAjusteCompraStatus.REGISTRADO, label: 'Registrada' },
    { value: NotaAjusteCompraStatus.ANULADO, label: 'Anulada' },
    { value: NotaAjusteCompraStatus.ERROR_ASIENTO, label: 'Error Asiento' }
  ];

  readonly tipos = [
    { value: '', label: 'Todos los tipos' },
    { value: 'CREDITO', label: 'Nota Crédito' },
    { value: 'DEBITO', label: 'Nota Débito' }
  ];

  applyFilters(): void {
    const filters: NotaComprasFilters = {};
    if (this.proveedorNombre()) filters.proveedorNombre = this.proveedorNombre();
    if (this.estado()) filters.estado = this.estado();
    if (this.tipo()) filters.tipo = this.tipo();
    if (this.facturaNumero()) filters.facturaNumero = this.facturaNumero();
    this.filterChange.emit(filters);
  }

  clearFilters(): void {
    this.proveedorNombre.set('');
    this.estado.set('');
    this.tipo.set('');
    this.facturaNumero.set('');
    this.filterChange.emit({});
  }

  getStatusClass(status: NotaAjusteCompraStatus): string {
    const classes: Record<NotaAjusteCompraStatus, string> = {
      [NotaAjusteCompraStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [NotaAjusteCompraStatus.REGISTRADO]: 'bg-green-100 text-green-800',
      [NotaAjusteCompraStatus.ANULADO]: 'bg-gray-500 text-white',
      [NotaAjusteCompraStatus.ERROR_ASIENTO]: 'bg-red-600 text-white'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: NotaAjusteCompraStatus): string {
    const labels: Record<NotaAjusteCompraStatus, string> = {
      [NotaAjusteCompraStatus.DRAFT]: 'Borrador',
      [NotaAjusteCompraStatus.REGISTRADO]: 'Registrada',
      [NotaAjusteCompraStatus.ANULADO]: 'Anulada',
      [NotaAjusteCompraStatus.ERROR_ASIENTO]: 'Error Asiento'
    };
    return labels[status] || status;
  }

  onRegistrarBorrador(id: string): void {
    this.registrarBorrador.emit(id);
  }

  onAnular(id: string): void {
    this.anular.emit(id);
  }

  onDelete(id: string): void {
    this.delete.emit(id);
  }

  onReintentarAsiento(id: string): void {
    this.reintentarAsiento.emit(id);
  }
}
