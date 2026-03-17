import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderTitlePageComponent, HeaderInput } from '@dashboard/components/header-title-page/header-title-page.component';
import { AgingReporte, HistorialPagosResponse, ResumenCartera } from '@dashboard/interfaces/pagos-interface';
import { PagosHttpService } from '@dashboard/pages/pagos/services/pagos.service';

type VistaActiva = 'resumen' | 'aging-cobrar' | 'aging-pagar' | 'historial';

@Component({
  selector: 'app-reporte-cartera',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, DecimalPipe, HeaderTitlePageComponent],
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
  fechaFin:    string;

  // ── Datos ──────────────────────────────────────────────────────────
  resumen:      ResumenCartera | null = null;
  agingCobrar:  AgingReporte   | null = null;
  agingPagar:   AgingReporte   | null = null;
  historial:    HistorialPagosResponse | null = null;

  // ── Estado de carga ────────────────────────────────────────────────
  loadingResumen  = false;
  loadingCobrar   = false;
  loadingPagar    = false;
  loadingHistorial = false;

  // ── Grupos expandidos en tabla aging ──────────────────────────────
  gruposAbiertos = new Set<string>();

  readonly buckets: Array<{
    key:       keyof AgingReporte['totales'];
    label:     string;
    bgClass:   string;
    textClass: string;
    badgeClass: string;
  }> = [
    { key: 'porVencer', label: 'Por Vencer', bgClass: 'bg-green-500',  textClass: 'text-green-700',  badgeClass: 'bg-green-100 text-green-700'  },
    { key: 'de1a30',    label: '1-30 días',  bgClass: 'bg-yellow-400', textClass: 'text-yellow-700', badgeClass: 'bg-yellow-100 text-yellow-700' },
    { key: 'de31a60',   label: '31-60 días', bgClass: 'bg-orange-500', textClass: 'text-orange-700', badgeClass: 'bg-orange-100 text-orange-700' },
    { key: 'de61a90',   label: '61-90 días', bgClass: 'bg-red-500',    textClass: 'text-red-700',    badgeClass: 'bg-red-100 text-red-700'       },
    { key: 'mas90',     label: '+90 días',   bgClass: 'bg-red-900',    textClass: 'text-red-900',    badgeClass: 'bg-red-200 text-red-900'       },
  ];

  constructor(private svc: PagosHttpService) {
    const now      = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.fechaInicio = firstDay.toISOString().split('T')[0];
    this.fechaFin    = lastDay.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargarResumen();
  }

  // ── Cargas ─────────────────────────────────────────────────────────
  cargarResumen(): void {
    this.loadingResumen = true;
    this.svc.getResumenCartera().subscribe({
      next:  d  => { console.log('Resumen: ', d); this.resumen = d; this.loadingResumen = false; },
      error: () => { this.loadingResumen = false; },
    });
  }

  cargarAgingCobrar(): void {
    if (this.agingCobrar) return; // ya cargado
    this.loadingCobrar = true;
    this.svc.getAgingCobrar().subscribe({
      next:  d  => { this.agingCobrar = d; this.loadingCobrar = false; },
      error: () => { this.loadingCobrar = false; },
    });
  }

  cargarAgingPagar(): void {
    if (this.agingPagar) return;
    this.loadingPagar = true;
    this.svc.getAgingPagar().subscribe({
      next:  d  => { this.agingPagar = d; this.loadingPagar = false; },
      error: () => { this.loadingPagar = false; },
    });
  }

  cargarHistorial(): void {
    this.loadingHistorial = true;
    this.svc.getHistorialGlobal(this.fechaInicio, this.fechaFin).subscribe({
      next:  d  => { this.historial = d; this.loadingHistorial = false; },
      error: () => { this.loadingHistorial = false; },
    });
  }

  // ── Navegación entre vistas ────────────────────────────────────────
  cambiarVista(vista: string): void {
    this.vistaActiva = vista as VistaActiva;
    if (vista === 'aging-cobrar') this.cargarAgingCobrar();
    if (vista === 'aging-pagar')  this.cargarAgingPagar();
    if (vista === 'resumen' && !this.resumen) this.cargarResumen();
  }

  generarHistorial(): void {
    this.historial = null;
    this.cargarHistorial();
  }

  // ── Helpers ────────────────────────────────────────────────────────
  toggleGrupo(id: string): void {
    if (this.gruposAbiertos.has(id)) this.gruposAbiertos.delete(id);
    else                              this.gruposAbiertos.add(id);
  }

  pct(valor: number, total: number): number {
    return total === 0 ? 0 : Math.round((valor / total) * 100);
  }

  get loadingActual(): boolean {
    if (this.vistaActiva === 'resumen')       return this.loadingResumen;
    if (this.vistaActiva === 'aging-cobrar')  return this.loadingCobrar;
    if (this.vistaActiva === 'aging-pagar')   return this.loadingPagar;
    if (this.vistaActiva === 'historial')     return this.loadingHistorial;
    return false;
  }
}