import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CardsTotales, NumCardsTotalesComponent } from '@shared/components/num-cards-totales/num-cards-totales.component';

const cardNum: CardsTotales[] = [
   {
      title: 'Ingresos del Mes',
      valor: '10',
      percent: '40'
   },
   {
      title: 'Gastos del Mes',
      valor: '0',
      percent: '20'
   },
   {
      title: 'Clientes Activos',
      valor: '2.000.000',
      percent: '20'
   },
   {
      title: 'Materiales Vendidos',
      valor: '89,120.00',
      percent: '20'
   },
]

@Component({
  selector: 'app-dashboarg-page',
  imports: [HeaderTitlePageComponent, RouterLink, NumCardsTotalesComponent],
  templateUrl: './dashboarg-page.component.html',
})
export class DashboargPageComponent {
    headTitle: HeaderInput = {
          title: 'Dashboard',
          slog: 'Resumen general de tu empresa'
    }

    accesoRapido = [
      {
        title: 'Facturas de Venta',
        ruta: '/panel/ventas/comprobantes'
      },
      {
        title: 'Clientes',
        ruta: '/panel/ventas/clients'
      },
      {
         title: 'Servicios',
        ruta: '/panel/ventas/products_services'
      }
    ]

    cardsValor = signal<CardsTotales[]>(cardNum);
 }
