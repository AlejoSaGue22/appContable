import { Component, inject } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';

import { CardsTotales, NumCardsTotalesComponent } from '@shared/components/num-cards-totales/num-cards-totales.component';
import { TableListComponent } from "@shared/components/table-list/table-list.component";
import { ClientesService } from '../services/clientes.service';
import { FlowbiteService } from 'src/app/utils/services/flowbite.service';
// import { CardsTotales, NumCardsTotalesComponent } from "../../../shared/components/num-cards-totales/num-cards-totales.component";


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

    flowbiteService = inject(FlowbiteService);

    clienteServices = inject(ClientesService);
    totalClientes = this.clienteServices.clienteRegistrados().length;

    cardsTotales : CardsTotales[] = [
         {
            title: 'Total Clientes',
            valor: this.totalClientes.toString(),
            percent: '20'
         },
         {
            title: 'Nuevos este Mes',
            valor: '0',
            percent: '20'
         },
         // {
         //    title: 'Total Clientes',
         //    valor: '0',
         //    percent: '20%'
         // }
      ];

    get columnsTable(){
      return [
         { key:'tipo', header: 'Tipo' },
         { key:'razonSocial', header: 'Nombre' },
         { key:'tipoDocumento', header: 'Documento' },
         { key:'numeroDocumento', header: 'Numero' },
         { key:'fecha', header: 'Fecha' },
         { key:'email', header: 'Correo' },
         { key:'telefono', header: 'Telefono' },
         { key:'direccion', header: 'Direccion' },
      ]
    }



    

 }
