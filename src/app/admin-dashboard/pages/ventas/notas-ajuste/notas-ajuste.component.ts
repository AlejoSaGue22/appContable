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
import { NotasAjusteService } from '../services/notas-ajuste.service';
import { TableNotasComponent, NotaFilters } from './components/table-notas/table-notas.component';

@Component({
  selector: 'app-notas-ajuste',
  standalone: true,
  imports: [LoaderComponent, ErrorPages, ModalComponent, TableNotasComponent, RouterLink, HeaderTitlePageComponent],
  templateUrl: './notas-ajuste.component.html',
})
export class NotasAjusteComponent {

  headTitle: HeaderInput = {
    title: 'Notas de Ajuste (Crédito/Débito)',
    slog: 'Administra las notas de ajuste aplicadas a tus facturas'
  };

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  notasService = inject(NotasAjusteService);
  paginationService = inject(PaginationService);
  notificationService = inject(NotificationService);
  loaderService = inject(LoaderService);

  filters = signal<NotaFilters>({});
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
        this.totalItems.set(res.meta?.total ?? 0);
        this.totalPages.set(res.meta?.totalPages ?? 1);
        this.paginationService.totalItems.set(res.meta?.total ?? 0);
      })
    )
  });

  onFilterChange(filters: NotaFilters): void {
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

  onEmitir(id: string): void {
    this.loaderService.show('Emitiendo nota a la DIAN...');
    this.notasService.emitirNotaAjuste(id).subscribe({
      next: (res: ResponseResult) => {
        this.loaderService.hide();
        if (res.success) {
          this.notificationService.success('Nota emitida con éxito', 'Éxito');
          this.notasResource.reload();
        } else {
          const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
          this.notificationService.error('Error al emitir', message || 'Error desconocido');
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
    this.notasService.updateNotaAjuste(this.idToDelete(), { status: 'cancelled' }).subscribe({
      next: (res: ResponseResult) => {
        this.loaderService.hide();
        this.isDeleteModalVisible.set(false);
        if (res.success) {
          this.notificationService.success('Nota eliminada con éxito', 'Éxito');
          this.notasResource.reload();
        } else {
          const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
          this.notificationService.error('Error al eliminar', message || 'Error desconocido');
        }
      },
      error: () => this.loaderService.hide()
    });
  }

  onDownloadPDF(id: string): void {
    this.loaderService.show('Preparando PDF...');
    this.notasService.downloadPDF(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nota-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.loaderService.hide();
      },
      error: () => this.loaderService.hide()
    });
  }

  onDownloadXML(id: string): void {
    this.loaderService.show('Preparando XML...');
    this.notasService.downloadXML(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nota-${id}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.loaderService.hide();
      },
      error: () => this.loaderService.hide()
    });
  }
}
