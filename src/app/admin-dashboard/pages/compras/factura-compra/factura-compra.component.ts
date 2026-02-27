import { Component, inject, signal } from '@angular/core';
import { HeaderInput } from "@dashboard/components/header-title-page/header-title-page.component";
import { CardsTotales } from "@shared/components/num-cards-totales/num-cards-totales.component";
import { FlowbiteService } from 'src/app/utils/services/flowbite.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap, of } from 'rxjs';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { ErrorPages } from "@shared/components/error-pages/error-pages.component";
import { HeaderTitleComprasComponent } from "./components/header-title-compras/header-title-compras.component";
import { TableComprasComponent, PurchaseInvoiceFilters } from "./components/table-compras/table-compras.component";
import { FacturaCompraService } from '../services/factura-compra.service';

@Component({
   selector: 'app-factura-compra',
   imports: [LoaderComponent, ErrorPages, HeaderTitleComprasComponent, TableComprasComponent],
   templateUrl: './factura-compra.component.html',
   standalone: true
})
export class FacturaCompraComponent {

   headTitle: HeaderInput = {
      title: 'Gestión de Facturas de Compra',
      slog: 'Administra tus comprobantes de compra'
   }

   // Paginación
   currentPage = signal(1);
   totalPages = signal(1);
   totalItems = signal(0);
   pageSize = signal(10);

   // Filtros
   filters = signal<PurchaseInvoiceFilters>({});

   paginationService = inject(PaginationService);
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
            this.totalItems.set(el.meta?.total ?? 0);
            this.totalPages.set(el.meta?.totalPages ?? 1);
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
      console.log('Page change requested:', page);
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
