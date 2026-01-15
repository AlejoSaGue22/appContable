import { Component, inject, signal } from '@angular/core';
import { HeaderInput } from "@dashboard/components/header-title-page/header-title-page.component";
import { CardsTotales } from "@shared/components/num-cards-totales/num-cards-totales.component";
import { FlowbiteService } from 'src/app/utils/services/flowbite.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap, of } from 'rxjs';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { ErrorPages } from "@shared/components/error-pages/error-pages.component";
import { HeaderTitleProveedoresComponent } from "./components/header-title-proveedores/header-title-proveedores.component";
import { TableProveedoresComponent } from "./components/table-proveedores/table-proveedores.component";

@Component({
  selector: 'app-proveedores',
  imports: [LoaderComponent, ErrorPages, HeaderTitleProveedoresComponent, TableProveedoresComponent],
  templateUrl: './proveedores.component.html',
  standalone: true
})
export class ProveedoresComponent {
  
    headTitle: HeaderInput = {
        title: 'Gestión de Proveedores',
        slog: 'Administra la información de tus proveedores'
    }

    // Paginación
   currentPage = signal(1);
   totalPages = signal(1);
   totalItems = signal(0);
   pageSize = signal(10);

    flowbiteService = inject(FlowbiteService);
    paginationService = inject(PaginationService);
    totalProveedores = signal<number>(0);
    cardsTotales = signal<CardsTotales[]>([]);

    // TODO: Reemplazar con el servicio real cuando esté disponible
    proveedoresResource = rxResource({
         request: () => ({ page: this.paginationService.currentPage() - 1, limit: 10 }),
         loader: ({ request }) => of({ 
            data: [], 
            meta: { total: 0, page: request.page, limit: request.limit } 
         }).pipe(
            tap((el) => {
               this.totalProveedores.set(el.meta?.total ?? 0);
               this.cardsTotales.set([
                  { title: 'Total Proveedores', valor: this.totalProveedores().toString(), percent: '0' },
                  { title: 'Proveedores Activos', valor: '0', percent: '0' },
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
         { key:'fecha', header: 'Fecha Registro' },
         { key:'identificacion', header: 'Identificación' },
         { key:'nombre', header: 'Nombre/Razón Social' },
         { key:'telefono', header: 'Teléfono' },
         { key:'email', header: 'Email' },
         { key:'estado', header: 'Estado' },
      ]
    }
 }
