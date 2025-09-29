import { Component } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';

import { CardsTotales, NumCardsTotalesComponent } from '@shared/components/num-cards-totales/num-cards-totales.component';
import { TableListComponent } from "@shared/components/table-list/table-list.component";
// import { CardsTotales, NumCardsTotalesComponent } from "../../../shared/components/num-cards-totales/num-cards-totales.component";

const cardNum: CardsTotales[] = [
   {
      title: 'Total Clientes',
      valor: '1.0000',
      percent: '20%'
   },
   {
      title: 'Nuevos este Mes',
      valor: '0',
      percent: '20%'
   },
   {
      title: 'Total Clientes',
      valor: '2.0000',
      percent: '20%'
   },
]

@Component({
  selector: 'app-clients-page',
  imports: [HeaderTitlePageComponent, NumCardsTotalesComponent, TableListComponent],
  templateUrl: './clients-page.component.html',
})
export class ClientsPageComponent {

    headTitle: HeaderInput = {
      title: 'Gestión de Clientes',
      slog: 'Administra la información de tus clientes y sus fórmulas'
    }

    cardsTotales = cardNum;

    get columnsTable(){
      return [
         { key:'fecha', header: 'Fecha' },
         { key:'tipo', header: 'Tipo' },
         { key:'documento', header: 'Documento' },
         { key:'nombre', header: 'Nombre' },
         { key:'apellidos', header: 'Apellidos' },
         { key:'telefono', header: 'Telefono' },
         { key:'ubicacion', header: 'Ubicacion' },
      ]
    }

    

 }
