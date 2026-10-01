import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { Empleado, Cargo } from '../../../interfaces/nomina.interface';

@Component({
  selector: 'app-empleado-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PaginationComponent,
    CurrencyPipe,
  ],
  templateUrl: './empleado-table.component.html',
})
export class EmpleadoTableComponent {
  empleados = input<Empleado[]>([]);
  cargos = input<Cargo[]>([]);
  activeFilters = input<any>({});

  delete = output<string>();
  filterChange = output<any>();

  // Filter signals
  search = signal<string>('');
  activo = signal<string>('');
  cargoId = signal<string>('');

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.search()) count++;
    if (this.activo() !== '') count++;
    if (this.cargoId()) count++;
    return count;
  });

  showFilters = signal<boolean>(false);

  constructor() {
    effect(() => {
      const filters = this.activeFilters();
      this.search.set(filters.search ?? '');
      this.activo.set(filters.activo ?? '');
      this.cargoId.set(filters.cargoId ?? '');

      if (filters.activo || filters.cargoId) {
        this.showFilters.set(true);
      }
    }, { allowSignalWrites: true });
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  applyFilters(): void {
    const filters: any = {};
    if (this.search()) filters.search = this.search();
    if (this.activo() !== '') filters.activo = this.activo();
    if (this.cargoId()) filters.cargoId = this.cargoId();

    this.filterChange.emit(filters);
  }

  clearFilters(): void {
    this.search.set('');
    this.activo.set('');
    this.cargoId.set('');

    this.filterChange.emit({});
  }
}
