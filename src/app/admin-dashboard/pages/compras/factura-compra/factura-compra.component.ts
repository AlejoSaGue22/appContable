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
import { TableComprasComponent } from "./components/table-compras/table-compras.component";

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

    flowbiteService = inject(FlowbiteService);
    paginationService = inject(PaginationService);
    totalCompras = signal<number>(0);
    cardsTotales = signal<CardsTotales[]>([]);

    // TODO: Reemplazar con el servicio real cuando esté disponible
    facturasCompraResource = rxResource({
         request: () => ({ page: this.paginationService.currentPage() - 1, limit: 10 }),
         loader: ({ request }) => of({ 
            data: [], 
            meta: { total: 0, page: request.page, limit: request.limit } 
         }).pipe(
            tap((el) => {
               this.totalCompras.set(el.meta?.total ?? 0);
               this.cardsTotales.set([
                  { title: 'Total Facturas Compra', valor: this.totalCompras().toString(), percent: '0' },
                  { title: 'Total Gastos', valor: '0', percent: '0' },
               ]);
            })
         )
    })

   formatCurrency(value: number): string {
      return new Intl.NumberFormat('es-CO', {
         style: 'currency',
         currency: 'COP',
         minimumFractionDigits: 0
      }).format(value);
   }

    get columnsTable(){
      return [
         { key:'fecha', header: 'Fecha' },
         { key:'comprobante', header: 'Comprobante' },
         { key:'proveedor', header: 'Proveedor' },
         { key:'total', header: 'Total' },
         { key:'impuestos', header: 'Impuestos' },
         { key:'estado', header: 'Estado' },
      ]
    }
 }
