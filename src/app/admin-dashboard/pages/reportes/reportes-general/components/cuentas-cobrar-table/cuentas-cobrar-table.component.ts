import { Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PagosHttpService } from '@dashboard/pages/pagos/services/pagos.service';
import { ReporteAgingFlatAgrupado } from '@dashboard/interfaces/pagos-interface';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, takeUntil } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-cuentas-cobrar-table',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, PaginationComponent],
  templateUrl: './cuentas-cobrar-table.component.html',
})
export class CuentasCobrarTableComponent implements OnDestroy {
  fechaInicio = input<string>('');
  fechaFin = input<string>('');
  paginationService = inject(PaginationService);
  private svc = inject(PagosHttpService);
  private notification = inject(NotificationService);
  private destroy$ = new Subject<void>();

  data = signal<ReporteAgingFlatAgrupado | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const inicio = this.fechaInicio();
      const fin = this.fechaFin();
      const page = this.paginationService.currentPage();
      if (inicio && fin) this.cargar(inicio, fin, page);
    });
  }

  private cargar(inicio: string, fin: string, page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getReporteAgingCobrar(inicio, fin, page, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => { this.data.set(res); this.loading.set(false); },
        error: () => { this.error.set('Error al cargar cuentas por cobrar'); this.loading.set(false); },
      });
  }

  exportarExcel(): void {
    const response = this.data();
    if (!response?.items?.length) {
      this.notification.info('Sin datos para exportar', 'Información');
      return;
    }
    const rows: any[] = [];
    response.items.forEach((item: any) => {
      rows.push({
        'NIT/ID': item.identificacion,
        Cliente: item.nombre,
        Deuda: item.deuda,
        'Saldo a Favor': item.saldoFavor,
        'Saldo Cartera': item.saldoCartera,
      });
    });
    if (response.totales) {
      rows.push({});
      rows.push({
        Cliente: 'TOTALES',
        Deuda: response.totales.totalDeuda,
        'Saldo a Favor': response.totales.totalSaldoFavor,
        'Saldo Cartera': response.totales.totalCartera,
      });
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cuentas por Cobrar');
    XLSX.writeFile(wb, `CuentasCobrar_${this.fechaInicio()}_${this.fechaFin()}.xlsx`);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
