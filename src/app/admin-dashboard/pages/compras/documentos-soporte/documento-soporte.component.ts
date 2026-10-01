import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardsTotales } from "@shared/components/num-cards-totales/num-cards-totales.component";
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { TableDocumentosSoporteComponent, DocumentoSoporteFilters } from "./components/table-documentos-soporte/table-documentos-soporte.component";
import { DocumentosSoporteService } from '../services/documentos-soporte.service';
import { ModalComponent } from "@shared/components/modal/modal.component";
import { ResponseResult } from '@shared/interfaces/services.interfaces';
import { NotificationService } from '@shared/services/notification.service';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { ErrorPages } from "@shared/components/error-pages/error-pages.component";
import { AuthService } from 'src/app/auth/services/auth.service';
import { UserAuth } from 'src/app/auth/interfaces/user-auth.interface';
import { CurrencyPipe } from '@angular/common';
import { avisarAdvertenciasInventario } from '@dashboard/services/inventario.service';

@Component({
    selector: 'app-documento-soporte',
    imports: [CommonModule, LoaderComponent, TableDocumentosSoporteComponent, ModalComponent, HeaderTitlePageComponent, ErrorPages, CurrencyPipe],
    templateUrl: './documento-soporte.component.html',
    standalone: true
})
export class DocumentoSoporteComponent {

    headTitle: HeaderInput = {
        title: 'Gestión de Documentos Soporte',
        slog: 'Administra tus documentos soporte'
    }

    private authService = inject(AuthService);
    user: UserAuth | null = this.authService.user();

    isModalItem = signal<boolean>(false);
    idItem = signal<string>('');
    action = signal<string>('');
    // Bloquea doble submit y muestra loader mientras se procesa la acción confirmada
    isProcessing = signal<boolean>(false);

    // Filtros
    filters = signal<DocumentoSoporteFilters>({});

    paginationService = inject(PaginationService);
    notificacionService = inject(NotificationService);
    documentoService = inject(DocumentosSoporteService);
    totalCompras = signal<number>(0);
    cardsTotales = signal<CardsTotales[]>([]);

    documentosSoporteResource = rxResource({
        request: () => ({
            page: this.paginationService.currentPage(),
            limit: 10,
            filters: this.filters()
        }),
        loader: ({ request }) => this.documentoService.getDocumentosSoporte({
            limit: request.limit,
            page: request.page,
            ...request.filters
        }).pipe(
            tap((el) => {
                this.totalCompras.set(el.data.length);
                this.paginationService.totalItems.set(el.meta?.total ?? 0);
                this.paginationService.pageSize.set(el.meta?.totalPages ?? 1);
                this.cardsTotales.set([
                    { title: 'Total Documentos', valor: this.totalCompras().toString(), percent: '0' },
                    { title: 'Total Gastos', valor: '0', percent: '0' },
                ]);
            })
        )
    })

    onFilterChange(filters: DocumentoSoporteFilters): void {
        this.filters.set(filters);
    }

    onPageChange(page: number): void {
        // Log removed
    }

    onAction(): void {
        if (this.isProcessing()) return;
        switch (this.action()) {
            case 'anular':
                this.onAnular();
                break;
            case 'delete':
                this.onDelete();
                break;
            case 'register':
                this.onRegister();
                break;
            case 'emitir':
                this.onEmitir();
                break;
            default:
                break;
        }
    }

    openModalItem(item: string, action: string): void {
        this.idItem.set(item);
        this.action.set(action);
        this.isModalItem.set(true);
    }

    onEmitir(): void {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.documentoService.emitirDocumentoSoporte(this.idItem()).subscribe((res: ResponseResult) => {
            this.isProcessing.set(false);
            this.isModalItem.set(false);
            if (res.success) {
                this.notificacionService.success('Documento emitido a la DIAN con éxito', 'Éxito');
                avisarAdvertenciasInventario(this.notificacionService, res.data);
                this.documentosSoporteResource.reload();
            } else {
                const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
                this.notificacionService.error('Error al emitir documento', message || 'Error desconocido');
            }
        });
    }

    onRetryAsiento(id: string): void {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.documentoService.retryAsiento(id).subscribe((res: ResponseResult) => {
            this.isProcessing.set(false);
            if (res.success) {
                this.notificacionService.success('Asiento reintentado con éxito', 'Éxito');
                this.documentosSoporteResource.reload();
            } else {
                const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
                this.notificacionService.error('Error al reintentar asiento', message || 'Error desconocido');
            }
        });
    }

    onRegister(): void {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.documentoService.registrarDocumentoSoporte(this.idItem()).subscribe((res: ResponseResult) => {
            this.isProcessing.set(false);
            this.isModalItem.set(false);
            if (res.success) {
                this.notificacionService.success('Documento registrado con éxito', 'Éxito');
                this.documentosSoporteResource.reload();
            } else {
                const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
                this.notificacionService.error('Error al registrar documento', message || 'Error desconocido');
            }
        });
    }

    onAnular(): void {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.documentoService.anularDocumentoSoporte(this.idItem()).subscribe((res: ResponseResult) => {
            this.isProcessing.set(false);
            this.isModalItem.set(false);
            if (res.success) {
                this.notificacionService.success('Documento anulado con éxito', 'Éxito');
                avisarAdvertenciasInventario(this.notificacionService, res.data);
                this.documentosSoporteResource.reload();
            } else {
                const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
                this.notificacionService.error('Error al anular documento', message || 'Error desconocido');
            }
        });
    }

    onDelete(): void {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.documentoService.deleteDocumentoSoporte(this.idItem()).subscribe((res: ResponseResult) => {
            this.isProcessing.set(false);
            this.isModalItem.set(false);
            if (res.success) {
                this.notificacionService.success('Documento eliminado con éxito', 'Éxito');
                this.documentosSoporteResource.reload();
            } else {
                const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
                this.notificacionService.error('Error al eliminar documento', message || 'Error desconocido');
            }
        });
    }

    get columnsTable() {
        return [
            { key: 'fecha', header: 'Fecha' },
            { key: 'comprobante', header: 'Comprobante' },
            { key: 'proveedor', header: 'Proveedor' },
            { key: 'total', header: 'Total' },
            { key: 'impuestos', header: 'Impuestos' },
            { key: 'estado', header: 'Estado' },
        ]
    }
}
