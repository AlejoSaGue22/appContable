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
import { avisarAdvertenciasInventario } from '@dashboard/services/inventario.service';
import { LoaderService } from '@utils/services/loader.service';
import { ResponseResult } from '@shared/interfaces/services.interfaces';
import { NotasAjusteSoporteService } from '../services/notas-ajuste-soporte.service';
import { NotaSoporteFilters, TableNotasSoporteComponent } from './components/table-notas-soporte/table-notas-soporte.component';

@Component({
    selector: 'app-notas-ajuste-soporte',
    standalone: true,
    imports: [LoaderComponent, ErrorPages, ModalComponent, TableNotasSoporteComponent, RouterLink, HeaderTitlePageComponent],
    templateUrl: './notas-ajuste-soporte.component.html',
})
export class NotasAjusteSoporteComponent {

    headTitle: HeaderInput = {
        title: 'Notas de Ajuste a Documentos Soporte',
        slog: 'Administra las notas de ajuste aplicadas a tus documentos soporte'
    };

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    notasService = inject(NotasAjusteSoporteService);
    paginationService = inject(PaginationService);
    notificationService = inject(NotificationService);
    loaderService = inject(LoaderService);

    filters = signal<NotaSoporteFilters>({});
    totalItems = signal(0);
    totalPages = signal(1);

    isDeleteModalVisible = signal(false);
    idToDelete = signal<string>('');

    isAnularModalVisible = signal(false);
    idToAnular = signal<string>('');
    motivoAnulacion = signal<string>('');

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

    onFilterChange(filters: NotaSoporteFilters): void {
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
                    avisarAdvertenciasInventario(this.notificationService, res.data);
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

    confirmAnular(id: string): void {
        this.idToAnular.set(id);
        this.motivoAnulacion.set('');
        this.isAnularModalVisible.set(true);
    }

    onAnular(): void {
        const motivo = this.motivoAnulacion().trim();
        if (!motivo) {
            this.notificationService.error('Indica el motivo de la anulación', 'Error');
            return;
        }
        this.loaderService.show('Anulando nota...');
        this.notasService.anularNotaAjuste(this.idToAnular(), motivo).subscribe({
            next: (res: ResponseResult) => {
                this.loaderService.hide();
                this.isAnularModalVisible.set(false);
                if (res.success) {
                    this.notificationService.success('Nota anulada con éxito', 'Éxito');
                    this.notasResource.reload();
                } else {
                    const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
                    this.notificationService.error(message || 'Error desconocido', 'Error al anular');
                }
            },
            error: () => this.loaderService.hide()
        });
    }
}
