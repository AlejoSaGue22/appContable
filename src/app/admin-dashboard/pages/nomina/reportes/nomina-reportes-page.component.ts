import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NominaService } from '../services/nomina.service';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { NotificationService } from '@shared/services/notification.service';
import * as XLSX from 'xlsx';

type ReporteTab = 'costos-centro-costo' | 'costos-cargo' | 'comparativo' | 'resumen-aportes';

@Component({
 selector: 'app-nomina-reportes-page',
 standalone: true,
 imports: [CommonModule, FormsModule, CurrencyPipe, HeaderTitlePageComponent],
 template: `
 <div class="p-6 space-y-6">
 <header-title-page [titleHead]="{ title: 'Reportes de Nómina', slog: 'Costos, comparativos y análisis de aportes' }">
 </header-title-page>

 <!-- Tabs -->
 <div class="flex items-center p-1 bg-gray-100/50 backdrop-blur-md rounded-2xl w-fit flex-wrap gap-1">
 <button (click)="tab.set('costos-centro-costo')"
 [class]="tab() === 'costos-centro-costo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'"
 class="px-6 py-2.5 rounded-xl text-md font-bold transition-all duration-300 cursor-pointer">
 Costos x Centro Costo
 </button>
 <button (click)="tab.set('costos-cargo')"
 [class]="tab() === 'costos-cargo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'"
 class="px-6 py-2.5 rounded-xl text-md font-bold transition-all duration-300 cursor-pointer">
 Costos x Cargo
 </button>
 <button (click)="tab.set('comparativo')"
 [class]="tab() === 'comparativo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'"
 class="px-6 py-2.5 rounded-xl text-md font-bold transition-all duration-300 cursor-pointer">
 Comparativo Períodos
 </button>
 <button (click)="tab.set('resumen-aportes')"
 [class]="tab() === 'resumen-aportes' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'"
 class="px-6 py-2.5 rounded-xl text-md font-bold transition-all duration-300 cursor-pointer">
 Aportes Parafiscales
 </button>
 </div>

 <!-- Filtros -->
 <div class="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100/50 p-6">
 @if (tab() === 'costos-centro-costo' || tab() === 'costos-cargo') {
 <div class="flex flex-col md:flex-row md:items-end gap-6">
 <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div class="space-y-2">
 <label class="font-medium text-gray-400 ml-1">Fecha Inicio</label>
 <input type="date" [(ngModel)]="fechaInicio"
 class="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all">
 </div>
 <div class="space-y-2">
 <label class="font-medium text-gray-400 ml-1">Fecha Fin</label>
 <input type="date" [(ngModel)]="fechaFin"
 class="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all">
 </div>
 </div>
 <button (click)="generar()" [disabled]="loading()"
 class="h-[36px] px-4 bg-slate-900 hover:bg-slate-700 cursor-pointer text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[160px]">
 Generar
 </button>
 <button (click)="exportarExcel()" [disabled]="!data()"
 class="h-[36px] px-4 bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
 Excel
 </button>
 </div>
 }

 @if (tab() === 'comparativo') {
 <div class="flex flex-col md:flex-row md:items-end gap-6">
 <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div class="space-y-2">
 <label class="font-medium text-gray-400 ml-1">Período 1</label>
 <select [(ngModel)]="periodo1Id" class="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm">
 <option value="">Seleccione...</option>
 @for (p of periodosList(); track p.id) {
 <option [value]="p.id">{{ p.nombre }} ({{ p.fechaInicio }} - {{ p.fechaFin }})</option>
 }
 </select>
 </div>
 <div class="space-y-2">
 <label class="font-medium text-gray-400 ml-1">Período 2</label>
 <select [(ngModel)]="periodo2Id" class="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm">
 <option value="">Seleccione...</option>
 @for (p of periodosList(); track p.id) {
 <option [value]="p.id">{{ p.nombre }} ({{ p.fechaInicio }} - {{ p.fechaFin }})</option>
 }
 </select>
 </div>
 </div>
 <button (click)="generar()" [disabled]="loading() || !periodo1Id || !periodo2Id"
 class="h-[36px] px-4 bg-slate-900 hover:bg-slate-700 cursor-pointer text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[160px]">
 Comparar
 </button>
 <button (click)="exportarExcel()" [disabled]="!data()"
 class="h-[36px] px-4 bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
 Excel
 </button>
 </div>
 }

 @if (tab() === 'resumen-aportes') {
 <div class="flex flex-col md:flex-row md:items-end gap-6">
 <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div class="space-y-2">
 <label class="font-medium text-gray-400 ml-1">Período</label>
 <select [(ngModel)]="periodoAportesId" class="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm">
 <option value="">Seleccione...</option>
 @for (p of periodosList(); track p.id) {
 <option [value]="p.id">{{ p.nombre }} ({{ p.fechaInicio }} - {{ p.fechaFin }})</option>
 }
 </select>
 </div>
 </div>
 <button (click)="generar()" [disabled]="loading() || !periodoAportesId"
 class="h-[36px] px-4 bg-slate-900 hover:bg-slate-700 cursor-pointer text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[160px]">
 Consultar
 </button>
 <button (click)="exportarExcel()" [disabled]="!data()"
 class="h-[36px] px-4 bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
 Excel
 </button>
 </div>
 }
 </div>

 <!-- Resultados -->
 <div class="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100/50 p-6">
 @if (loading()) {
 <div class="flex justify-center py-12">
 <svg class="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
 <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
 <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
 </svg>
 </div>
 } @else if (!data()) {
 <div class="text-center py-12 text-slate-400">
 Seleccione filtros y presione Generar para visualizar el reporte.
 </div>
 } @else {
 @switch (tab()) {
 @case ('costos-centro-costo') {
 @if (costosData) {
 <div class="overflow-x-auto rounded-xl border border-slate-200">
 <table class="w-full text-sm">
 <thead class="bg-slate-50 text-slate-600 text-xs font-bold uppercase ">
 <tr>
 <th class="px-4 py-3 text-left">Centro de Costo</th>
 <th class="px-4 py-3 text-right">Empleados</th>
 <th class="px-4 py-3 text-right">Devengado</th>
 <th class="px-4 py-3 text-right">Aportes</th>
 <th class="px-4 py-3 text-right">Provisiones</th>
 <th class="px-4 py-3 text-right">Costo Total</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-slate-100">
 @for (r of costosData.data; track r.centroCostoId || $index) {
 <tr class="hover:bg-slate-50 transition-colors">
 <td class="px-4 py-3 font-medium">{{ r.centroCostoNombre }}</td>
 <td class="px-4 py-3 text-right">{{ r.empleados }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ r.totalDevengado | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ r.totalAportes | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ r.totalProvisiones | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right font-bold">{{ r.totalCosto | currency:'':'':'1.0-0' }}</td>
 </tr>
 }
 </tbody>
 <tfoot class="bg-slate-100 font-bold">
 <tr>
 <td class="px-4 py-3">TOTALES</td>
 <td class="px-4 py-3 text-right">{{ costosData.totales.empleados }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ costosData.totales.totalDevengado | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ costosData.totales.totalAportes | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ costosData.totales.totalProvisiones | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ costosData.totales.totalCosto | currency:'':'':'1.0-0' }}</td>
 </tr>
 </tfoot>
 </table>
 </div>
 }
 }

 @case ('costos-cargo') {
 @if (costosData) {
 <div class="overflow-x-auto rounded-xl border border-slate-200">
 <table class="w-full text-sm">
 <thead class="bg-slate-50 text-slate-600 text-xs font-bold uppercase ">
 <tr>
 <th class="px-4 py-3 text-left">Cargo</th>
 <th class="px-4 py-3 text-right">Empleados</th>
 <th class="px-4 py-3 text-right">Devengado</th>
 <th class="px-4 py-3 text-right">Aportes</th>
 <th class="px-4 py-3 text-right">Provisiones</th>
 <th class="px-4 py-3 text-right">Costo Total</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-slate-100">
 @for (r of costosData.data; track r.cargoId || $index) {
 <tr class="hover:bg-slate-50 transition-colors">
 <td class="px-4 py-3 font-medium">{{ r.cargoNombre }}</td>
 <td class="px-4 py-3 text-right">{{ r.empleados }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ r.totalDevengado | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ r.totalAportes | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ r.totalProvisiones | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right font-bold">{{ r.totalCosto | currency:'':'':'1.0-0' }}</td>
 </tr>
 }
 </tbody>
 <tfoot class="bg-slate-100 font-bold">
 <tr>
 <td class="px-4 py-3">TOTALES</td>
 <td class="px-4 py-3 text-right">{{ costosData.totales.empleados }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ costosData.totales.totalDevengado | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ costosData.totales.totalAportes | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ costosData.totales.totalProvisiones | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ costosData.totales.totalCosto | currency:'':'':'1.0-0' }}</td>
 </tr>
 </tfoot>
 </table>
 </div>
 }
 }

 @case ('comparativo') {
 @if (comparativoData) {
 <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
 <div *ngFor="let p of [comparativoData.periodo1, comparativoData.periodo2]; let i = index" class="bg-white rounded-xl border border-slate-200 p-4">
 <h3 class="font-bold text-slate-700 mb-2">{{ i === 0 ? 'Período 1' : 'Período 2' }}</h3>
 <p class="text-sm text-slate-500 mb-4">{{ p.nombre }} ({{ p.fechaInicio }} - {{ p.fechaFin }})</p>
 <div class="space-y-2 text-sm">
 <div class="flex justify-between"><span class="text-slate-500">Empleados:</span><span class="font-mono font-bold">{{ p.empleados }}</span></div>
 <div class="flex justify-between"><span class="text-slate-500">Devengado:</span><span class="font-mono">{{ p.totalDevengado | currency:'':'':'1.0-0' }}</span></div>
 <div class="flex justify-between"><span class="text-slate-500">Deducciones:</span><span class="font-mono">{{ p.totalDeducciones | currency:'':'':'1.0-0' }}</span></div>
 <div class="flex justify-between"><span class="text-slate-500">Neto a Pagar:</span><span class="font-mono font-bold">{{ p.totalNeto | currency:'':'':'1.0-0' }}</span></div>
 <div class="flex justify-between"><span class="text-slate-500">Aportes Empresa:</span><span class="font-mono">{{ p.totalAportes | currency:'':'':'1.0-0' }}</span></div>
 <div class="flex justify-between"><span class="text-slate-500">Provisiones:</span><span class="font-mono">{{ p.totalProvisiones | currency:'':'':'1.0-0' }}</span></div>
 <div class="flex justify-between border-t pt-2"><span class="text-slate-700 font-bold">Costo Empresa:</span><span class="font-mono font-bold text-blue-700">{{ p.costoEmpresa | currency:'':'':'1.0-0' }}</span></div>
 </div>
 </div>
 </div>

 @if (comparativoData.detalleEmpleados?.length) {
 <h4 class="font-bold text-slate-600 mb-3">Detalle por Empleado</h4>
 <div class="overflow-x-auto rounded-xl border border-slate-200">
 <table class="w-full text-sm">
 <thead class="bg-slate-50 text-slate-600 text-xs font-bold uppercase ">
 <tr>
 <th class="px-4 py-3 text-left">Empleado</th>
 <th class="px-4 py-3 text-right">Devengado P1</th>
 <th class="px-4 py-3 text-right">Devengado P2</th>
 <th class="px-4 py-3 text-right">Variación</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-slate-100">
 @for (d of comparativoData.detalleEmpleados; track d.empleadoId) {
 <tr class="hover:bg-slate-50">
 <td class="px-4 py-3 font-medium">{{ d.empleadoNombre }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ d.periodo1.devengado | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ d.periodo2?.devengado | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right"
 [class.text-green-600]="d.variacion !== null && d.variacion >= 0"
 [class.text-red-600]="d.variacion !== null && d.variacion < 0">
 {{ d.variacion !== null ? d.variacion + '%' : 'N/A' }}
 </td>
 </tr>
 }
 </tbody>
 </table>
 </div>
 }
 }
 }

 @case ('resumen-aportes') {
 @if (aportesData) {
 <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
 <p class="text-xs text-slate-400">Total Aportes</p>
 <p class="text-2xl font-bold text-blue-700">{{ aportesData.totales.totalAportes | currency:'':'':'1.0-0' }}</p>
 </div>
 <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
 <p class="text-xs text-slate-400">Empleados</p>
 <p class="text-2xl font-bold">{{ aportesData.totales.totalEmpleados }}</p>
 </div>
 <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
 <p class="text-xs text-slate-400">Total Devengado</p>
 <p class="text-2xl font-bold text-emerald-700">{{ aportesData.totales.totalDevengado | currency:'':'':'1.0-0' }}</p>
 </div>
 </div>

 <div class="overflow-x-auto rounded-xl border border-slate-200 mb-6">
 <table class="w-full text-sm">
 <thead class="bg-slate-50 text-slate-600 text-xs font-bold uppercase ">
 <tr>
 <th class="px-4 py-3 text-left">Concepto</th>
 <th class="px-4 py-3 text-right">Empleados</th>
 <th class="px-4 py-3 text-right">Valor</th>
 <th class="px-4 py-3 text-right">%</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-slate-100">
 @for (r of aportesData.resumen; track r.concepto) {
 <tr class="hover:bg-slate-50">
 <td class="px-4 py-3 font-medium">{{ r.concepto }}</td>
 <td class="px-4 py-3 text-right">{{ r.empleados }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ r.valor | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">
 {{ (r.valor / (aportesData.totales.totalAportes || 1)) * 100 | number:'1.1-1' }}%
 </td>
 </tr>
 }
 </tbody>
 <tfoot class="bg-slate-100 font-bold">
 <tr>
 <td class="px-4 py-3">TOTAL</td>
 <td class="px-4 py-3 text-right"></td>
 <td class="px-4 py-3 font-mono text-right">{{ aportesData.totales.totalAportes | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">100%</td>
 </tr>
 </tfoot>
 </table>
 </div>

 <h4 class="font-bold text-slate-600 mb-3">Detalle por Empleado</h4>
 <div class="overflow-x-auto rounded-xl border border-slate-200">
 <table class="w-full text-sm">
 <thead class="bg-slate-50 text-slate-600 text-xs font-bold uppercase ">
 <tr>
 <th class="px-4 py-3 text-left">Empleado</th>
 <th class="px-4 py-3 text-right">IBC</th>
 <th class="px-4 py-3 text-right">Total Aportes</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-slate-100">
 @for (d of aportesData.detalleEmpleados; track d.empleadoId) {
 <tr class="hover:bg-slate-50">
 <td class="px-4 py-3 font-medium">{{ d.empleadoNombre }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ d.ibc | currency:'':'':'1.0-0' }}</td>
 <td class="px-4 py-3 font-mono text-right">{{ d.totalAportesEmpleado | currency:'':'':'1.0-0' }}</td>
 </tr>
 }
 </tbody>
 </table>
 </div>
 }
 }
 }
 }
 </div>
 </div>
 `,
})
export class NominaReportesPageComponent {
 private readonly nominaService = inject(NominaService);
 private readonly notification = inject(NotificationService);

 tab = signal<ReporteTab>('costos-centro-costo');
 loading = signal(false);
 data = signal<any>(null);

 fechaInicio = '';
 fechaFin = '';
 periodo1Id = '';
 periodo2Id = '';
 periodoAportesId = '';

 periodosList = signal<any[]>([]);
 costosData: any = null;
 comparativoData: any = null;
 aportesData: any = null;

 constructor() {
 this.cargarPeriodos();
 }

 private cargarPeriodos() {
 this.nominaService.getPeriodos({ limit: 100 }).subscribe({
 next: (res) => this.periodosList.set(res.data || []),
 });
 }

 generar() {
 this.loading.set(true);
 this.data.set(null);
 this.costosData = null;
 this.comparativoData = null;
 this.aportesData = null;

 switch (this.tab()) {
 case 'costos-centro-costo':
 this.nominaService.getReporteCostosCentroCosto(this.fechaInicio, this.fechaFin).subscribe({
 next: (r) => { this.costosData = r; this.data.set(r); this.loading.set(false); },
 error: () => { this.loading.set(false); this.notification.error('Error al cargar reporte'); },
 });
 break;

 case 'costos-cargo':
 this.nominaService.getReporteCostosCargo(this.fechaInicio, this.fechaFin).subscribe({
 next: (r) => { this.costosData = r; this.data.set(r); this.loading.set(false); },
 error: () => { this.loading.set(false); this.notification.error('Error al cargar reporte'); },
 });
 break;

 case 'comparativo':
 this.nominaService.getReporteComparativo(this.periodo1Id, this.periodo2Id).subscribe({
 next: (r) => { this.comparativoData = r; this.data.set(r); this.loading.set(false); },
 error: () => { this.loading.set(false); this.notification.error('Error al cargar reporte'); },
 });
 break;

 case 'resumen-aportes':
 this.nominaService.getReporteResumenAportes(this.periodoAportesId).subscribe({
 next: (r) => { this.aportesData = r; this.data.set(r); this.loading.set(false); },
 error: () => { this.loading.set(false); this.notification.error('Error al cargar reporte'); },
 });
 break;
 }
 }

 exportarExcel() {
 const d = this.data();
 if (!d) return;

 let rows: any[] = [];
 let filename = '';

 if (this.costosData) {
 const field = this.tab() === 'costos-centro-costo' ? 'centroCostoNombre' : 'cargoNombre';
 const label = this.tab() === 'costos-centro-costo' ? 'Centro Costo' : 'Cargo';
 rows = [
 ...d.data.map((r: any) => ({
 [label]: r[field],
 Empleados: r.empleados,
 Devengado: r.totalDevengado,
 Aportes: r.totalAportes,
 Provisiones: r.totalProvisiones,
 'Costo Total': r.totalCosto,
 })),
 { [label]: 'TOTALES', Empleados: d.totales.empleados, Devengado: d.totales.totalDevengado, Aportes: d.totales.totalAportes, Provisiones: d.totales.totalProvisiones, 'Costo Total': d.totales.totalCosto },
 ];
 filename = `nomina_costos_${this.tab()}`;
 } else if (this.comparativoData) {
 rows = [
 { Concepto: 'Empleados', [`${d.periodo1.nombre}`]: d.periodo1.empleados, [`${d.periodo2.nombre}`]: d.periodo2.empleados },
 { Concepto: 'Devengado', [`${d.periodo1.nombre}`]: d.periodo1.totalDevengado, [`${d.periodo2.nombre}`]: d.periodo2.totalDevengado },
 { Concepto: 'Deducciones', [`${d.periodo1.nombre}`]: d.periodo1.totalDeducciones, [`${d.periodo2.nombre}`]: d.periodo2.totalDeducciones },
 { Concepto: 'Neto a Pagar', [`${d.periodo1.nombre}`]: d.periodo1.totalNeto, [`${d.periodo2.nombre}`]: d.periodo2.totalNeto },
 { Concepto: 'Aportes Empresa', [`${d.periodo1.nombre}`]: d.periodo1.totalAportes, [`${d.periodo2.nombre}`]: d.periodo2.totalAportes },
 { Concepto: 'Provisiones', [`${d.periodo1.nombre}`]: d.periodo1.totalProvisiones, [`${d.periodo2.nombre}`]: d.periodo2.totalProvisiones },
 { Concepto: 'Costo Empresa', [`${d.periodo1.nombre}`]: d.periodo1.costoEmpresa, [`${d.periodo2.nombre}`]: d.periodo2.costoEmpresa },
 ];
 filename = 'nomina_comparativo';
 } else if (this.aportesData) {
 rows = d.resumen.map((r: any) => ({
 Concepto: r.concepto,
 Empleados: r.empleados,
 Valor: r.valor,
 '%': ((r.valor / (d.totales.totalAportes || 1)) * 100).toFixed(1),
 }));
 rows.push({ Concepto: 'TOTAL', Empleados: '', Valor: d.totales.totalAportes, '%': '100%' });
 filename = 'nomina_aportes';
 }

 const ws = XLSX.utils.json_to_sheet(rows);
 const wb = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
 XLSX.writeFile(wb, `${filename}.xlsx`);
 }
}
