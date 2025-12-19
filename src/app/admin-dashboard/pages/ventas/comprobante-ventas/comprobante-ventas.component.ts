import { Component, inject, signal } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { TableListComponent } from "@shared/components/table-list/table-list.component";
import { CardsTotales, NumCardsTotalesComponent } from "@shared/components/num-cards-totales/num-cards-totales.component";
import { FlowbiteService } from 'src/app/utils/services/flowbite.service';
import { ComprobantesVentasService } from '../services/comprobantes-ventas.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";

@Component({
  selector: 'app-comprobante-ventas',
  imports: [HeaderTitlePageComponent, TableListComponent, NumCardsTotalesComponent, LoaderComponent],
  templateUrl: './comprobante-ventas.component.html',
})
export class ComprobanteVentasComponent {
  
    headTitle: HeaderInput = {
        title: 'Gestión de Documentos de venta',
        slog: 'Administra la información de tus facturas'
    }

    flowbiteService = inject(FlowbiteService);
    comprobantesVentasService = inject(ComprobantesVentasService);
    paginationService = inject(PaginationService);
    totalComprobantes = signal(0);
    cardsTotales = signal<CardsTotales[]>([]);

    comprobanteVentasResource = rxResource({
         request: () => ({ page: this.paginationService.currentPage() - 1, limit: 10 }),
         loader: ({ request }) => this.comprobantesVentasService.getComprobanteVentas({ offset: request.page * 9, limit: request.limit })
                  .pipe(
                     tap((el) => {
                           this.totalComprobantes.set(el.count);
                           this.cardsTotales.set([
                              { title: 'Total Facturas', valor: this.totalComprobantes().toString(), percent: '0' },
                              { title: 'Balance General', valor: '0', percent: '0' },
                           ]);
                     })
                  )
    })

    get columnsTable(){
      return [
         { key:'fecha', header: 'Fecha' },
         { key:'comprobante', header: 'Comprobante' },
         { key:'identificacion', header: 'Identificacion' },
         { key:'cliente', header: 'Cliente' },
         { key:'total', header: 'Total' },
         { key:'impuestos', header: 'Impuestos' },
         { key:'estado', header: 'Estado' },
      ]
    }
 }
