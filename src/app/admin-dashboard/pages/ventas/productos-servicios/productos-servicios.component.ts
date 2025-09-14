import { Component, signal } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CardsTotales, NumCardsTotalesComponent } from '@shared/components/num-cards-totales/num-cards-totales.component';
import { TableListComponent } from "@shared/components/table-list/table-list.component";

const cardNum: CardsTotales[] = [
   {
      title: 'Total Productos',
      valor: '10',
      percent: '40'
   },
   {
      title: 'Nuevos este Mes',
      valor: '0',
      percent: '20'
   },
   {
      title: 'Total Servicios',
      valor: '$2.0000',
      percent: '20'
   },
]

@Component({
  selector: 'app-productos-servicios',
  imports: [HeaderTitlePageComponent, TableListComponent, NumCardsTotalesComponent],
  templateUrl: './productos-servicios.component.html',
})
export class ProductosServiciosComponent {
    headTitleCliente: HeaderInput = {
        title: 'Productos y Servicios',
        slog: 'Administra la información de tus productos y servicios'
    }

    cardValor = signal<CardsTotales[]>(cardNum);

    get columnsTable(){
      return [
         { key:'fecha', header: 'Fecha' },
         { key:'tipo', header: 'Tipo' },
         { key:'nombre', header: 'Cod. Nombre' },
         { key:'unidad', header: 'Unidad' },
         { key:'precio', header: 'Precio' },
         { key:'impuestos', header: 'Impuestos' },
         { key:'estado', header: 'Estado' },
      ]
    }

 }
