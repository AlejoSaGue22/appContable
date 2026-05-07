import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {HeaderTitlePageComponent, HeaderInput } from '@dashboard/components/header-title-page/header-title-page.component';
import { AgingReporte, HistorialPagosResponse, ResumenCartera, ReporteAgingFlatAgrupado } from '@dashboard/interfaces/pagos-interface';
import { PagosHttpService } from '@dashboard/pages/pagos/services/pagos.service';
import * as XLSX from 'xlsx';
import { AgingReportComponent } from "./components/aging-report/aging-report.component";
import { HistorialPagosComponent } from "./components/historial-pagos/historial-pagos.component";

type VistaActiva = 'resumen' | 'aging-cobrar' | 'aging-pagar' | 'historial';

@Component({
  selector: 'app-reporte-cartera',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    HeaderTitlePageComponent,
    AgingReportComponent,
    HistorialPagosComponent
],
  templateUrl: './reportes-cartera.component.html',
})
export class ReportesCarteraComponent implements OnInit {
  headTitle: HeaderInput = {
    title: 'Reporte de Cartera',
    slog: 'Antigüedad de cartera y movimientos de pagos',
  };

  // ── Vista activa ───────────────────────────────────────────────────
  vistaActiva: VistaActiva = 'resumen';

  // ── Fechas historial ───────────────────────────────────────────────
  fechaInicio: string;
  fechaFin: string;

  // ── Datos ──────────────────────────────────────────────────────────
  resumen: ResumenCartera | null = null;
  agingCobrar: ReporteAgingFlatAgrupado | null = null;
  agingPagar: ReporteAgingFlatAgrupado | null = null;
  historial: HistorialPagosResponse | null = null;

  // ── Estado de carga ────────────────────────────────────────────────
  loadingResumen = false;
  loadingCobrar = false;
  loadingPagar = false;
  loadingHistorial = false;

  // ── Grupos expandidos en tabla aging ──────────────────────────────
  gruposAbiertos = new Set<string>();

  readonly buckets: Array<{
    key: keyof AgingReporte['totales'];
    label: string;
    bgClass: string;
    textClass: string;
    badgeClass: string;
  }> = [
    {
      key: 'porVencer',
      label: 'Por Vencer',
      bgClass: 'bg-green-500',
      textClass: 'text-green-700',
      badgeClass: 'bg-green-100 text-green-700',
    },
    {
      key: 'de1a30',
      label: '1-30 días',
      bgClass: 'bg-yellow-400',
      textClass: 'text-yellow-700',
      badgeClass: 'bg-yellow-100 text-yellow-700',
    },
    {
      key: 'de31a60',
      label: '31-60 días',
      bgClass: 'bg-orange-500',
      textClass: 'text-orange-700',
      badgeClass: 'bg-orange-100 text-orange-700',
    },
    {
      key: 'de61a90',
      label: '61-90 días',
      bgClass: 'bg-red-500',
      textClass: 'text-red-700',
      badgeClass: 'bg-red-100 text-red-700',
    },
    {
      key: 'mas90',
      label: '+90 días',
      bgClass: 'bg-red-900',
      textClass: 'text-red-900',
      badgeClass: 'bg-red-200 text-red-900',
    },
  ];

  constructor(private svc: PagosHttpService) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.fechaInicio = firstDay.toISOString().split('T')[0];
    this.fechaFin = lastDay.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargarResumen();
  }

  // ── Cargas ─────────────────────────────────────────────────────────
  cargarResumen(): void {
    this.loadingResumen = true;
    this.svc.getResumenCartera().subscribe({
      next: (d) => {
        this.resumen = d;
        this.loadingResumen = false;
      },
      error: () => {
        this.loadingResumen = false;
      },
    });
  }

  cargarAgingCobrar(): void {
    this.loadingCobrar = true;
    this.svc.getReporteAgingCobrar(this.fechaInicio, this.fechaFin).subscribe({
      next: (d) => {
        this.agingCobrar = d;
        this.loadingCobrar = false;
      },
      error: () => {
        this.loadingCobrar = false;
      },
    });
  }

  cargarAgingPagar(): void {
    this.loadingPagar = true;
    this.svc.getReporteAgingPagar(this.fechaInicio, this.fechaFin).subscribe({
      next: (d) => {
        this.agingPagar = d;
        this.loadingPagar = false;
      },
      error: () => {
        this.loadingPagar = false;
      },
    });
  }

  cargarHistorial(): void {
    this.loadingHistorial = true;
    this.svc.getHistorialGlobal(this.fechaInicio, this.fechaFin).subscribe({
      next: (d) => {
        this.historial = d;
        this.loadingHistorial = false;
      },
      error: () => {
        this.loadingHistorial = false;
      },
    });
  }

  // ── Navegación entre vistas ────────────────────────────────────────
  cambiarVista(vista: string): void {
    this.vistaActiva = vista as VistaActiva;
    // Limpiamos resultados previos para forzar nueva búsqueda con el botón Generar
    if (vista === 'aging-cobrar') this.agingCobrar = null;
    if (vista === 'aging-pagar') this.agingPagar = null;
    if (vista === 'historial') this.historial = null;
    if (vista === 'resumen' && !this.resumen) this.cargarResumen();
  }

  generarReporte(): void {
    if (this.vistaActiva === 'aging-cobrar') this.cargarAgingCobrar();
    if (this.vistaActiva === 'aging-pagar') this.cargarAgingPagar();
    if (this.vistaActiva === 'historial') this.cargarHistorial();
  }

  generarHistorial(): void {
    this.historial = null;
    this.cargarHistorial();
  }

  exportarExcel(): void {
    let data: any[] = [];
    let filename = 'reporte';

    if (this.vistaActiva === 'historial' && this.historial) {
      filename = `Historial_Pagos_${this.fechaInicio}_${this.fechaFin}`;
      data = this.historial.pagos.map((p) => ({
        Fecha: p.fecha,
        Tipo: p.tipo.toUpperCase(),
        Banco: p.cuentaBancaria?.banco.nombre,
        NumeroCuenta: p.cuentaBancaria?.numeroCuenta,
        Documento: p.numeroFactura,
        Contraparte: p.contraparte,
        Medio: p.medioPago,
        Referencia: p.referencia || '',
        Monto: p.monto,
      }));
    } else if (this.vistaActiva === 'aging-cobrar' || this.vistaActiva === 'aging-pagar') {
      const reporte = this.vistaActiva === 'aging-cobrar' ? this.agingCobrar : this.agingPagar;
      if (!reporte) return;

      filename = this.vistaActiva === 'aging-cobrar' ? 'Antiguedad_por_Cobrar' : 'Antiguedad_por_Pagar';
      const labelContraparte = this.vistaActiva === 'aging-cobrar' ? 'Cliente' : 'Proveedor';

      data = reporte.items.map(f => ({
        'ID/NIT': f.identificacion,
        [labelContraparte]: f.nombre,
        'Deuda': f.deuda,
        'Pagos Aplicados': f.saldoFavor,
        'Saldo Cartera': f.saldoCartera,
      }));

      // Añadir fila de totales
      const totales = reporte.totales;
      data.push({});
      data.push({
        [labelContraparte]: 'TOTALES',
        'Deuda': totales.totalDeuda,
        'Pagos Aplicados': totales.totalSaldoFavor,
        'Saldo Cartera': totales.totalCartera
      });
    }

    if (data.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  // ── Helpers ────────────────────────────────────────────────────────
  toggleGrupo(id: string): void {
    if (this.gruposAbiertos.has(id)) this.gruposAbiertos.delete(id);
    else this.gruposAbiertos.add(id);
  }

  pct(valor: number, total: number): number {
    return total === 0 ? 0 : Math.round((valor / total) * 100);
  }

  get loadingActual(): boolean {
    if (this.vistaActiva === 'resumen') return this.loadingResumen;
    if (this.vistaActiva === 'aging-cobrar') return this.loadingCobrar;
    if (this.vistaActiva === 'aging-pagar') return this.loadingPagar;
    if (this.vistaActiva === 'historial') return this.loadingHistorial;
    return false;
  }
}
