import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { PrescripcionesService } from '@dashboard/pages/ventas/services/prescripciones.service';
import { Prescripcion } from '@dashboard/pages/ventas/interfaces/prescripcion.interface';
import { PrintService } from '@shared/services/print.service';


@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, PaginationComponent, HeaderTitlePageComponent],
  templateUrl: './prescripciones.component.html'
})
export class PrescripcionesComponent {
  private readonly service = inject(PrescripcionesService);
  private readonly router = inject(Router);
  private readonly printService = inject(PrintService);
  readonly pagination = inject(PaginationService);

  constructor() {
    effect(() => {
      const response = this.resource.value();
      if (response?.meta) {
        this.pagination.totalItems.set(response.meta.total);
        this.pagination.pageSize.set(response.meta.totalPages);
      }
    });
  }

  search = signal('');
  appliedSearch = signal('');
  desde = signal('');
  hasta = signal('');
  typeFilter = signal<'ALL' | 'OFTALMICO' | 'CONTACTO'>('ALL');

  resource = rxResource({
    request: () => ({
      page: this.pagination.currentPage(),
      search: this.appliedSearch(),
      desde: this.desde(),
      hasta: this.hasta()
    }),
    loader: ({ request }) => {
      const params: Record<string, string | number> = {
        page: request.page || 1,
        limit: 10,
      };
      if (request.search && request.search.trim()) {
        params['search'] = request.search.trim();
      }
      if (request.desde && request.desde.trim()) {
        params['desde'] = request.desde.trim();
      }
      if (request.hasta && request.hasta.trim()) {
        params['hasta'] = request.hasta.trim();
      }
      return this.service.list(params);
    },
  });

  apply(): void {
    this.appliedSearch.set(this.search().trim());
    this.router.navigate([], { queryParams: { page: 1 }, queryParamsHandling: 'merge' });
  }

  clear(): void {
    this.search.set('');
    this.appliedSearch.set('');
    this.desde.set('');
    this.hasta.set('');
    this.typeFilter.set('ALL');
    this.router.navigate([], { queryParams: { page: 1 }, queryParamsHandling: 'merge' });
  }

  items(): Prescripcion[] {
    const all = this.resource.value()?.data ?? [];
    if (this.typeFilter() === 'ALL') {
      return all;
    }
    return all.filter(p => p.tipoLente === this.typeFilter());
  }

  totalItems(): number {
    return this.resource.value()?.meta?.total ?? 0;
  }

  countByType(type: 'OFTALMICO' | 'CONTACTO'): number {
    const all = this.resource.value()?.data ?? [];
    return all.filter(p => p.tipoLente === type).length;
  }

  patientName(item: Prescripcion): string {
    const c = item.cliente;
    return c?.razonSocial || `${c?.nombre || ''} ${c?.apellido || ''}`.trim() || 'Sin paciente';
  }

  patientInitials(item: Prescripcion): string {
    const name = this.patientName(item);
    if (!name || name === 'Sin paciente') return 'PA';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  patientDoc(item: Prescripcion): string {
    return item.cliente?.numeroDocumento || 'Sin doc.';
  }

  typeLabel(value: string): string {
    return value === 'OFTALMICO' ? 'Lente Oftálmico' : value === 'CONTACTO' ? 'Lente de Contacto' : 'Especializado';
  }

  hasActiveFilters(): boolean {
    return !!this.appliedSearch() || !!this.desde() || !!this.hasta() || this.typeFilter() !== 'ALL';
  }

  printPrescripcion(item: Prescripcion): void {
    this.printService.printPrescripcion(item);
  }
}
