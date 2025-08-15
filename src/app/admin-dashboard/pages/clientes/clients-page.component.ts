import { Component } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from "../../components/header-title-page/header-title-page.component";
import { CardsTotales, NumCardsTotalesComponent } from "../../../shared/components/num-cards-totales/num-cards-totales.component";

const cardNum: CardsTotales[] = [
    {
      title: 'Total Clientes',
      valor: 0,
      percent: '20%'
   },
   {
      title: 'Nuevos este Mes',
      valor: 0,
      percent: '20%'
   },
   {
      title: 'Total Clientes',
      valor: 0,
      percent: '20%'
   },
]

@Component({
  selector: 'app-clients-page',
  imports: [HeaderTitlePageComponent, NumCardsTotalesComponent],
  templateUrl: './clients-page.component.html',
})
export class ClientsPageComponent {

    headTitle: HeaderInput = {
      title: 'Gestión de Clientes',
      slog: 'Administra la información de tus clientes y sus fórmulas'
    }

    cardsTotales = cardNum;

 }
