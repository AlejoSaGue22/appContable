import { Component, inject, signal, computed } from '@angular/core';
import { ReportesService } from '../services/reportes.service';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { NotificationService } from '@shared/services/notification.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import { BalanceCuentasTableComponent } from './components/balance-cuentas-table/balance-cuentas-table.component';
import { CuentasContablesService } from '../../contabilidad/services/cuentas-contables.service';

@Component({
  selector: 'app-reportes-general',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, HeaderTitlePageComponent, BalanceCuentasTableComponent],
  templateUrl: './reportes-general.component.html',
})
export class ReportesGeneralComponent {
  private reportesService = inject(ReportesService);
  private notificationService = inject(NotificationService);
  private cuentasService = inject(CuentasContablesService);

  activeTab = signal<'facturacion' | 'dian' | 'recaudos' | 'impuestos' | 'balance'>('facturacion');

  // Dates
  fechaInicio = signal<string>(this.getDefaultDates().firstDay);
  fechaFin = signal<string>(this.getDefaultDates().lastDay);

  // Applied dates (to trigger resource reload)
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

  // ── Resources ─────────────────────────────────────────────────────

  // General metrics resource
  reportesResource = rxResource({
    request: () => this.appliedDates(),
    loader: ({ request }) => forkJoin({
      facturacion: this.reportesService.getFacturacionDetallada(request.inicio, request.fin),
      dian: this.reportesService.getConciliacionDIAN(request.inicio, request.fin),
      recaudos: this.reportesService.getConciliacionRecaudos(request.inicio, request.fin),
      impuestos: this.reportesService.getImpuestosDetallado(request.inicio, request.fin)
    }).pipe(
      catchError((err) => {
        this.notificationService.error('Error al generar los reportes avanzados', err.error?.message || 'Error');
        return of(null);
      })
    )
  });

  // Balance contable resource
  balanceResource = rxResource({
    request: () => ({ ...this.appliedDates(), activeTab: this.activeTab() }),
    loader: ({ request }) => {
      // Only load if tab is balance
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

  // Computed properties for easy access in template
  facturacion = computed(() => this.reportesResource.value()?.facturacion);
  conciliacionDIAN = computed(() => this.reportesResource.value()?.dian);
  conciliacionRecaudos = computed(() => this.reportesResource.value()?.recaudos);
  impuestos = computed(() => this.reportesResource.value()?.impuestos);
  
  cuentasContables = computed(() => {
    const data = this.balanceResource.value() || [];
    return [...data].sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  loading = computed(() => this.reportesResource.isLoading());
  loadingCuentas = computed(() => this.balanceResource.isLoading());

  // ── Actions ───────────────────────────────────────────────────────

  generarReporte(): void {
    this.appliedDates.set({
      inicio: this.fechaInicio(),
      fin: this.fechaFin()
    });
  }

  exportarPDF(): void {
    this.notificationService.info('Función de exportar a PDF próximamente', 'Próximamente');
  }

  exportarExcel(): void {
    this.notificationService.info('Función de exportar a Excel próximamente', 'Próximamente');
  }

  onTabChange(tab: 'facturacion' | 'dian' | 'recaudos' | 'impuestos' | 'balance'): void {
    this.activeTab.set(tab);
  }
}
