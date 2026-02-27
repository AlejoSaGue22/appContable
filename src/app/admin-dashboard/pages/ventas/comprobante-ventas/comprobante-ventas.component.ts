import { Component, inject, signal } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { TableListComponent } from "@shared/components/table-list/table-list.component";
import { CardsTotales, NumCardsTotalesComponent } from "@shared/components/num-cards-totales/num-cards-totales.component";
import { ComprobantesVentasService } from '../services/comprobantes-ventas.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { ErrorPages } from "@shared/components/error-pages/error-pages.component";
import { HeaderTitleInvoices } from "./components/header-title-invoices/header-title-invoices.component";
import { TableInvoices, InvoiceFilters } from "./components/table-invoices/table-invoices.component";
import { NotificationService } from '@shared/services/notification.service';
import { ResponseResult } from '@shared/interfaces/services.interfaces';
import { ModalComponent } from "@shared/components/modal/modal.component";

@Component({
   selector: 'app-comprobante-ventas',
   imports: [LoaderComponent, ErrorPages, HeaderTitleInvoices, TableInvoices, ModalComponent],
   templateUrl: './comprobante-ventas.component.html',
})
export class ComprobanteVentasComponent {

   headTitle: HeaderInput = {
      title: 'Gestión de Documentos de venta',
      slog: 'Administra la información de tus facturas'
   }
   notificacionService = inject(NotificationService);
   comprobantesVentasService = inject(ComprobantesVentasService);
   paginationService = inject(PaginationService);

   currentPage = signal(1);
   totalPages = signal(1);
   totalItems = signal(0);
   pageSize = signal(10);
   isModalAnular = signal<boolean>(false);
   idAnular = signal<string>('');
   totalComprobantes = signal<number>(0);
   cardsTotales = signal<CardsTotales[]>([]);
   filters = signal<InvoiceFilters>({});


   comprobanteVentasResource = rxResource({
      request: () => ({
         page: this.paginationService.currentPage(),
         limit: 10,
         filters: this.filters()
      }),
      loader: ({ request }) => this.comprobantesVentasService.getComprobanteVentas({
         page: request.page,
         limit: request.limit,
         ...request.filters
      })
         .pipe(
            tap((el) => {
               this.totalComprobantes.set(el.meta?.total ?? 0);
               this.totalItems.set(el.meta?.total ?? 0);
               this.totalPages.set(el.meta?.totalPages ?? 1);
               this.cardsTotales.set([
                  { title: 'Total Facturas', valor: this.totalComprobantes().toString(), percent: '0' },
                  { title: 'Balance General', valor: '0', percent: '0' },
               ]);
            })
         )
   })

   onFilterChange(filters: InvoiceFilters): void {
      this.filters.set(filters);
   }

   onPageChange(page: number): void {
      // Page changes are handled by PaginationService via query params
      // This would require navigation, which is typically handled by the pagination component
      console.log('Page change requested:', page);
   }

   formatCurrency(value: number): string {
      return new Intl.NumberFormat('es-CO', {
         style: 'currency',
         currency: 'COP',
         minimumFractionDigits: 0
      }).format(value);
   }

   //    getStatusLabel(status: InvoiceStatus): string {
   //     const labels: Record<InvoiceStatus, string> = {
   //       [InvoiceStatus.DRAFT]: 'Borrador',
   //       [InvoiceStatus.ISSUED]: 'Emitida',
   //       [InvoiceStatus.PAID]: 'Pagada',
   //       [InvoiceStatus.CANCELLED]: 'Cancelada'
   //     };
   //     return labels[status];
   //   }

   get columnsTable() {
      return [
         { key: 'fecha', header: 'Fecha' },
         { key: 'comprobante', header: 'Comprobante' },
         { key: 'identificacion', header: 'Identificacion' },
         { key: 'cliente', header: 'Cliente' },
         { key: 'total', header: 'Total' },
         { key: 'impuestos', header: 'Impuestos' },
         { key: 'estado', header: 'Estado' },
      ]
   }

   openModalAnular(id: string): void {
      this.isModalAnular.set(true);
      this.idAnular.set(id);
   }

   onEmitir(id: string): void {
      this.comprobantesVentasService.emitirInvoice(id).subscribe((res: ResponseResult) => {
         if (res.success) {
            this.notificacionService.success('Factura emitida con éxito', 'Éxito');
            this.comprobanteVentasResource.reload();
         } else {
            const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
            this.notificacionService.error('Error al emitir factura', message || 'Error desconocido');
         }
      });
   }

   onAnular(): void {
      // Simplificado: En un caso real podrías abrir un modal para pedir el motivo
      const motivo = 'Anulación solicitada por el usuario';
      this.comprobantesVentasService.anularInvoice(this.idAnular(), motivo).subscribe((res: ResponseResult) => {
         if (res.success) {
            this.notificacionService.success('Factura anulada con éxito', 'Éxito');
            this.comprobanteVentasResource.reload();
         } else {
            const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
            this.notificacionService.error('Error al anular factura', message || 'Error desconocido');
         }
      });
   }

   onDownloadPDF(id: string): void {
      this.comprobantesVentasService.downloadPDF(id).subscribe((blob) => {
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `factura-${id}.pdf`;
         a.click();
         window.URL.revokeObjectURL(url);
      });
   }

   onDownloadXML(id: string): void {
      this.comprobantesVentasService.downloadXML(id).subscribe((blob) => {
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `factura-${id}.xml`;
         a.click();
         window.URL.revokeObjectURL(url);
      });
   }

}
