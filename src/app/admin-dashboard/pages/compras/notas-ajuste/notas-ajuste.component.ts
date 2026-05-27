import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { LoaderComponent } from "@utils/components/loader/loader.component";
import { ErrorPages } from "@shared/components/error-pages/error-pages.component";
import { ModalComponent } from "@shared/components/modal/modal.component";
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { ResponseResult } from '@shared/interfaces/services.interfaces';
import { ComprasNotasAjusteService } from '../services/compras-notas-ajuste.service';
import { NotaComprasFilters, TableNotasComprasComponent } from './components/table-notas/table-notas.component';

@Component({
  selector: 'app-notas-ajuste-compras',
  standalone: true,
  imports: [LoaderComponent, ErrorPages, ModalComponent, TableNotasComprasComponent, RouterLink, HeaderTitlePageComponent],
  templateUrl: './notas-ajuste.component.html',
})
export class NotasAjusteComprasComponent {

  headTitle: HeaderInput = {
    title: 'Notas de Crédito de Compras',
    slog: 'Administra las notas de crédito aplicadas a tus facturas de compras'
  };

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  notasService = inject(ComprasNotasAjusteService);
  paginationService = inject(PaginationService);
  notificationService = inject(NotificationService);
  loaderService = inject(LoaderService);

  filters = signal<NotaComprasFilters>({});
  totalItems = signal(0);
  totalPages = signal(1);
  
  isDeleteModalVisible = signal(false);
  idToDelete = signal<string>('');

  notasResource = rxResource({
    request: () => ({
      page: this.paginationService.currentPage(),
      limit: 10,
      filters: this.filters()
    }),
    loader: ({ request }) => this.notasService.getNotasAjuste({
      page: request.page,
      limit: request.limit,
      ...request.filters
    }).pipe(
      tap((res) => {
        const size = res.meta?.totalPages ? res.meta.totalPages : 1;
        this.paginationService.totalItems.set(res.meta?.total ?? 0);
        this.paginationService.pageSize.set(size);
      })
    )
  });

  onFilterChange(filters: NotaComprasFilters): void {
    this.filters.set(filters);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...filters, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  onRegistrarBorrador(id: string): void {
    this.loaderService.show('Registrando nota...');
    this.notasService.registrarBorrador(id).subscribe({
      next: (res: ResponseResult) => {
        this.loaderService.hide();
        if (res.success) {
          this.notificationService.success('Nota registrada con éxito', 'Éxito');
          this.notasResource.reload();
        } else {
          const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
          this.notificationService.error(message || 'Error desconocido', 'Error al registrar');
        }
      },
      error: () => this.loaderService.hide()
    });
  }

  confirmDelete(id: string): void {
    this.idToDelete.set(id);
    this.isDeleteModalVisible.set(true);
  }

  onDelete(): void {
    this.loaderService.show('Eliminando nota...');
    this.notasService.removeNotaAjuste(this.idToDelete()).subscribe({
      next: (res: ResponseResult) => {
        this.loaderService.hide();
        this.isDeleteModalVisible.set(false);
        if (res.success) {
          this.notificationService.success('Nota eliminada con éxito', 'Éxito');
          this.notasResource.reload();
        } else {
          const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
          this.notificationService.error(message || 'Error desconocido', 'Error al eliminar');
        }
      },
      error: () => this.loaderService.hide()
    });
  }

  onReintentarAsiento(id: string): void {
    this.loaderService.show('Generando asiento contable...');
    this.notasService.reintentarAsiento(id).subscribe({
      next: (res: ResponseResult) => {
        this.loaderService.hide();
        if (res.success) {
          this.notificationService.success('Asiento generado con éxito', 'Éxito');
          this.notasResource.reload();
        } else {
          const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
          this.notificationService.error(message || 'Error desconocido', 'Error al generar asiento');
        }
      },
      error: () => this.loaderService.hide()
    });
  }
}
