import { Component, inject, signal, computed } from '@angular/core';
import { ReportesService } from '../services/reportes.service';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { NotificationService } from '@shared/services/notification.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { BalanceCuentasTableComponent } from './components/balance-cuentas-table/balance-cuentas-table.component';
import { FacturasVentaTableComponent } from './components/facturas-venta-table/facturas-venta-table.component';
import { FacturasCompraTableComponent } from './components/facturas-compra-table/facturas-compra-table.component';
import { CuentasCobrarTableComponent } from './components/cuentas-cobrar-table/cuentas-cobrar-table.component';
import { CuentasPagarTableComponent } from './components/cuentas-pagar-table/cuentas-pagar-table.component';
import { CuentasContablesService } from '../../contabilidad/services/cuentas-contables.service';

@Component({
  selector: 'app-reportes-general',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe, FormsModule, HeaderTitlePageComponent,
    BalanceCuentasTableComponent, FacturasVentaTableComponent,
    FacturasCompraTableComponent, CuentasCobrarTableComponent,
    CuentasPagarTableComponent
  ],
  templateUrl: './reportes-general.component.html',
})
export class ReportesGeneralComponent {
  private reportesService = inject(ReportesService);
  private notificationService = inject(NotificationService);
  private cuentasService = inject(CuentasContablesService);

  activeTab = signal<'facturacion' | 'facturas-venta' | 'facturas-compra' | 'cxc' | 'cxp' | 'balance'>('facturacion');

  fechaInicio = signal<string>(this.getDefaultDates().firstDay);
  fechaFin = signal<string>(this.getDefaultDates().lastDay);

  appliedDates = signal({
    inicio: this.fechaInicio(),
    fin: this.fechaFin()
  });

  headTitle: HeaderInput = {
    title: 'Reportes Generales',
    slog: 'Análisis de rentabilidad del período'
  };

  protected readonly Math = Math;

  private getDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return { firstDay, lastDay };
  }

  reportesResource = rxResource({
    request: () => this.appliedDates(),
    loader: ({ request }) => this.reportesService.getFacturacionDetallada(request.inicio, request.fin).pipe(
      catchError((err) => {
        this.notificationService.error('Error al generar el reporte de facturación', err.error?.message || 'Error');
        return of(null);
      })
    )
  });

  balanceResource = rxResource({
    request: () => ({ ...this.appliedDates(), activeTab: this.activeTab() }),
    loader: ({ request }) => {
      if (request.activeTab !== 'balance') return of([]);
      return this.cuentasService.getCuentasContables({
        fechaInicio: request.inicio,
        fechaFin: request.fin
      }).pipe(
        catchError(() => {
          this.notificationService.error('Error al cargar el balance contable', 'Error');
          return of([]);
        })
      );
    }
  });

  facturacion = computed(() => this.reportesResource.value());

  cuentasContables = computed(() => {
    const data = this.balanceResource.value() || [];
    return [...data].sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  loading = computed(() => this.reportesResource.isLoading());
  loadingCuentas = computed(() => this.balanceResource.isLoading());

  generarReporte(): void {
    this.appliedDates.set({
      inicio: this.fechaInicio(),
      fin: this.fechaFin()
    });
  }

  onTabChange(tab: 'facturacion' | 'facturas-venta' | 'facturas-compra' | 'cxc' | 'cxp' | 'balance'): void {
    this.activeTab.set(tab);
  }

  limpiarTabla(): void {
    const defaults = this.getDefaultDates();
    this.fechaInicio.set(defaults.firstDay);
    this.fechaFin.set(defaults.lastDay);
    this.appliedDates.set({ inicio: '', fin: '' });
    this.activeTab.set('facturacion');
  }
}
