import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodoNomina } from '../../../interfaces/nomina.interface';
import { PaginationComponent } from '@shared/components/pagination/pagination';

@Component({
  selector: 'app-periodos-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    PaginationComponent,
  ],
  templateUrl: './periodos-table.component.html',
})
export class PeriodosTableComponent {
  periodos = input<PeriodoNomina[]>([]);

  gestionarEmpleados = output<PeriodoNomina>();
  liquidar = output<PeriodoNomina>();
  prepararPago = output<PeriodoNomina>();
  verDetalle = output<PeriodoNomina>();
  anular = output<PeriodoNomina>();
  enviarDian = output<PeriodoNomina>();
  descargarXml = output<PeriodoNomina>();

  // Filter signals
  search = signal<string>('');
  estado = signal<string>('');
  tipo = signal<string>('');

  showFilters = signal<boolean>(false);

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.search()) count++;
    if (this.estado()) count++;
    if (this.tipo()) count++;
    return count;
  });

  filteredPeriodos = computed(() => {
    let list = this.periodos();
    const searchTerm = this.search().toLowerCase().trim();
    const estadoFilter = this.estado();
    const tipoFilter = this.tipo();

    if (searchTerm) {
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm) ||
          p.tipo.toLowerCase().includes(searchTerm)
      );
    }

    if (estadoFilter) {
      list = list.filter((p) => p.estado === estadoFilter);
    }

    if (tipoFilter) {
      list = list.filter((p) => p.tipo === tipoFilter);
    }

    return list;
  });

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  applyFilters(): void {
    // Computed signal updates automatically
  }

  clearFilters(): void {
    this.search.set('');
    this.estado.set('');
    this.tipo.set('');
  }
}
