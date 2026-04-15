import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardsTotales } from "@shared/components/num-cards-totales/num-cards-totales.component";
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";

import { TableComprasComponent, PurchaseInvoiceFilters } from "./components/table-compras/table-compras.component";
import { FacturaCompraService } from '../services/factura-compra.service';
import { ModalComponent } from "@shared/components/modal/modal.component";
import { ResponseResult } from '@shared/interfaces/services.interfaces';
import { NotificationService } from '@shared/services/notification.service';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { ErrorPages } from "@shared/components/error-pages/error-pages.component";
import { AuthService } from 'src/app/auth/services/auth.service';
import { UserAuth } from 'src/app/auth/interfaces/user-auth.interface';

@Component({
   selector: 'app-factura-compra',
   imports: [CommonModule, LoaderComponent, TableComprasComponent, ModalComponent, HeaderTitlePageComponent, ErrorPages],
   templateUrl: './factura-compra.component.html',
   standalone: true
})
export class FacturaCompraComponent {

   headTitle: HeaderInput = {
      title: 'Gestión de Facturas de Compra',
      slog: 'Administra tus comprobantes de compra'
   }

   private authService = inject(AuthService);
   user: UserAuth | null = this.authService.user();

   isModalItem = signal<boolean>(false);
   idItem = signal<string>('');
   action = signal<string>('');

   // Filtros
   filters = signal<PurchaseInvoiceFilters>({});

   paginationService = inject(PaginationService);
   notificacionService = inject(NotificationService);
   facturaService = inject(FacturaCompraService);
   totalCompras = signal<number>(0);
   cardsTotales = signal<CardsTotales[]>([]);

   facturasCompraResource = rxResource({
      request: () => ({
         page: this.paginationService.currentPage() - 1,
         limit: 10,
         filters: this.filters()
      }),
      loader: ({ request }) => this.facturaService.getFacturasCompras({
         limit: request.limit,
         page: request.page,
         ...request.filters
      }).pipe(
         tap((el) => {
            this.totalCompras.set(el.data.length);
            this.paginationService.totalItems.set(el.meta?.total ?? 0);
            this.paginationService.pageSize.set(el.meta?.totalPages ?? 1);
            this.cardsTotales.set([
               { title: 'Total Facturas Compra', valor: this.totalCompras().toString(), percent: '0' },
               { title: 'Total Gastos', valor: '0', percent: '0' },
            ]);
         })
      )
   })

   onFilterChange(filters: PurchaseInvoiceFilters): void {
      this.filters.set(filters);
   }

   onPageChange(page: number): void {
      // Log removed
   }

   onAction(): void {
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
         default:
            break;
      }
   }

   openModalItem(item: string, action: string): void {
      this.idItem.set(item);
      this.action.set(action);
      this.isModalItem.set(true);
   }

   onRetryAsiento(id: string): void {
      this.isModalItem.set(false);
      this.facturaService.retryAsiento(id).subscribe((res: ResponseResult) => {
         if (res.success) {
            this.isModalItem.set(false);
            this.notificacionService.success('Asiento reintentado con éxito', 'Éxito');
            this.facturasCompraResource.reload();
         } else {
            const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
            this.notificacionService.error('Error al reintentar asiento', message || 'Error desconocido');
         }
      });
   }

   onRegister(): void {
      this.isModalItem.set(false);
      this.facturaService.registrarFacturaCompra(this.idItem()).subscribe((res: ResponseResult) => {
         if (res.success) {
            this.isModalItem.set(false);
            this.notificacionService.success('Factura registrada con éxito', 'Éxito');
            this.facturasCompraResource.reload();
         } else {
            const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
            this.notificacionService.error('Error al registrar factura', message || 'Error desconocido');
         }
      });
   }

   onAnular(): void {
      this.isModalItem.set(false);
      this.facturaService.anularFacturaCompra(this.idItem()).subscribe((res: ResponseResult) => {
         if (res.success) {
            this.isModalItem.set(false);
            this.notificacionService.success('Factura anulada con éxito', 'Éxito');
            this.facturasCompraResource.reload();
         } else {
            const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
            this.notificacionService.error('Error al anular factura', message || 'Error desconocido');
         }
      });
   }  

   onDelete(): void {
      this.isModalItem.set(false);  
      this.facturaService.deleteFacturaCompra(this.idItem()).subscribe((res: ResponseResult) => {
         if (res.success) {
            this.isModalItem.set(false);
            this.notificacionService.success('Factura eliminada con éxito', 'Éxito');
            this.facturasCompraResource.reload();
         } else {
            const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
            this.notificacionService.error('Error al eliminar factura', message || 'Error desconocido');
         }
      });
   }

   formatCurrency(value: number): string {
      return new Intl.NumberFormat('es-CO', {
         style: 'currency',
         currency: 'COP',
         minimumFractionDigits: 0
      }).format(value);
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
