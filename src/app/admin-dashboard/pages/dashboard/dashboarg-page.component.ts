import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CardsTotales, NumCardsTotalesComponent } from '@shared/components/num-cards-totales/num-cards-totales.component';
import { DashboardService } from './services/dashboard.service';
import { DashboardHistory, DashboardResponse, RecentTransaction } from '@dashboard/interfaces/dashboard.interface';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';



@Component({
   selector: 'app-dashboarg-page',
   imports: [HeaderTitlePageComponent, RouterLink, NumCardsTotalesComponent, CurrencyPipe, DatePipe],
   templateUrl: './dashboarg-page.component.html',
})
export class DashboargPageComponent implements OnInit {

   private dashboardService = inject(DashboardService);

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

   cardsValor = signal<CardsTotales[]>([]);
   recentTransactions = signal<RecentTransaction[]>([]);
   history = signal<DashboardHistory[]>([]);

   chartData = computed(() => {
      const data = this.history();
      if (!data.length) return [];

      const maxVal = Math.max(...data.map(item => Math.max(item.ingresos, item.egresos)));
      
      const scaleBase = maxVal > 0 ? maxVal * 1.1 : 1;

      return data.map(item => ({
         ...item,
         ingresosHeight: Math.min((item.ingresos / scaleBase) * 100, 100),
         egresosHeight: Math.min((item.egresos / scaleBase) * 100, 100)
      }));
   });

   ngOnInit(): void {
      this.loadDashboardData();
   }

   loadDashboardData() {
      this.dashboardService.getSummary().subscribe({
         next: (data: DashboardResponse) => {
            this.mappingCards(data);
            this.recentTransactions.set(data.recentTransactions);
            this.history.set(data.history);
         }
      })
   }

   mappingCards(data: DashboardResponse) {
      const cards: CardsTotales[] = [
         {
            title: 'Ingresos',
            valor: data.totals.ingresos.toString(),
            percent: '0'
         },
         {
            title: 'Egresos',
            valor: data.totals.egresos.toString(),
            percent: '0'
         },
         {
            title: 'Compras',
            valor: data.totals.compras.toString(),
            percent: '0'
         },
         {
            title: 'Utilidad',
            valor: data.totals.utilidad.toString(),
            percent: '0'
         },
         {
            title: 'Saldo Caja',
            valor: data.totals.saldoCaja.toString(),
            percent: '0'
         }
      ];
      this.cardsValor.set(cards);
   }
}
