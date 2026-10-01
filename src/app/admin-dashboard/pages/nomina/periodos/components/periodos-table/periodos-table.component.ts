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
  verDetalle = output<PeriodoNomina>();
  reversar = output<PeriodoNomina>();
  enviarDian = output<PeriodoNomina>();
  descargarXml = output<PeriodoNomina>();
  eliminar = output<PeriodoNomina>();
  filtersChanged = output<any>();

  search = signal<string>('');
  estado = signal<string>('');
  tipo = signal<string>('');
  anio = signal<string>('');

  showFilters = signal<boolean>(false);

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.search()) count++;
    if (this.estado()) count++;
    if (this.tipo()) count++;
    if (this.anio()) count++;
    return count;
  });

  filteredPeriodos = computed(() => {
    // The filtering is now handled by the backend
    return this.periodos();
  });

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  applyFilters(): void {
    this.filtersChanged.emit({
      search: this.search(),
      estado: this.estado(),
      tipo: this.tipo(),
      anio: this.anio(),
    });
  }

  clearFilters(): void {
    this.search.set('');
    this.estado.set('');
    this.tipo.set('');
    this.anio.set('');
    this.applyFilters();
  }
}
