import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CardsTotales, NumCardsTotalesComponent } from '@shared/components/num-cards-totales/num-cards-totales.component';
import { DashboardService } from './services/dashboard.service';
import { DashboardHistory, DashboardResponse, RecentTransaction } from '@dashboard/interfaces/dashboard.interface';
import { QuickAccess } from "./components/quick-access/quick-access.component";
import { TransaccionesRecientesCard } from "./components/transacciones-recientes-card/transacciones-recientes-card.component";
import { FlujoCajaCard } from "./components/flujo-caja-card/flujo-caja-card.component";
import { DashboardAvanzadoKPIs } from '../../interfaces/reportes-avanzados.interface';
import { DecimalPipe, CurrencyPipe, NgClass } from '@angular/common';
import { AuthService } from 'src/app/auth/services/auth.service';
import { HelpersUtils } from '@utils/helpers.utils';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';


@Component({
 selector: 'app-dashboarg-page',
 imports: [HeaderTitlePageComponent, NumCardsTotalesComponent, QuickAccess, TransaccionesRecientesCard, FlujoCajaCard, CurrencyPipe, NgClass, DecimalPipe, SkeletonComponent],
 templateUrl: './dashboarg-page.component.html',
})
export class DashboargPageComponent implements OnInit {

 private dashboardService = inject(DashboardService);

 headTitle = signal<HeaderInput>({
 title: 'Dashboard Estratégico',
 slog: 'Vista avanzada y control financiero por periodos'
 })

 selectedPeriod = signal<string>('current_month');
 periods = [
 { label: 'Mes Actual', value: 'current_month' },
 { label: 'Mes Anterior', value: 'last_month' },
 { label: 'Hace 3 Meses', value: 'last_3_months' },
 { label: 'Año Actual', value: 'current_year' },
 { label: 'Año Anterior', value: 'last_year' }
 ];

 accesoRapido = [
 {
 title: 'Facturas de Venta',
 ruta: '/panel/ventas/comprobantes'
 },
 {
 title: 'Facturas Compras',
 ruta: '/panel/compras/purchases'
 },
 {
 title: 'Pagos',
 ruta: '/panel/pagos/cxc'
 }
 ];

 roles = signal(['Super Admin','Admin','User' ]);
 role = inject(AuthService).user()?.role;
 logoApp = HelpersUtils.logoApp;
 nameApp = HelpersUtils.nameApp;
 cardsValor = signal<CardsTotales[]>([]);
 recentTransactions = signal<RecentTransaction[]>([]);
 history = signal<DashboardHistory[]>([]);
 
 // New signals for refined dashboard
 dashboardData = signal<DashboardResponse | null>(null);

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
 this.dashboardService.getSummary(this.selectedPeriod()).subscribe({
 next: (data: DashboardResponse) => {
 this.dashboardData.set(data);
 this.recentTransactions.set(data.recentTransactions);
 this.history.set(data.history);
 }
 });
 }

 onPeriodChange(event: Event) {
 const select = event.target as HTMLSelectElement;
 this.selectedPeriod.set(select.value);
 this.loadDashboardData();
 }
}

