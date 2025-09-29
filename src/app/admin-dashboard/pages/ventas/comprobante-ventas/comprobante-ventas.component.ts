import { Component } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { TableListComponent } from "@shared/components/table-list/table-list.component";
import { CardsTotales, NumCardsTotalesComponent } from "@shared/components/num-cards-totales/num-cards-totales.component";

const cardNum: CardsTotales[] = [
   {
      title: 'Balance General',
      valor: '1.000.000',
      percent: '30%'
   },
   {
      title: 'Flujo de Caja',
      valor: '12.000.000',
      percent: '20%'
   },
   {
      title: 'Total Facturas',
      valor: '2.000.000',
      percent: '40%'
   },
]

@Component({
  selector: 'app-comprobante-ventas',
  imports: [HeaderTitlePageComponent, TableListComponent, NumCardsTotalesComponent],
  templateUrl: './comprobante-ventas.component.html',
})
export class ComprobanteVentasComponent {
  
    headTitle: HeaderInput = {
        title: 'Gestión de Documentos de venta',
        slog: 'Administra la información de tus facturas'
    }

    cardsTotales = cardNum;

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
