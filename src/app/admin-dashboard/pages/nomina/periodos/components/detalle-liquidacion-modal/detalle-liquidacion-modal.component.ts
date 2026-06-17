import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeriodoNomina, Liquidacion, PagoNomina } from '../../../interfaces/nomina.interface';

@Component({
 selector: 'app-detalle-liquidacion-modal',
 standalone: true,
 imports: [CommonModule],
 template: `
 <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
 <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
 
 <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
 <div>
 <h3 class="text-xl font-bold">{{ periodo().nombre }}</h3>
 <p class="text-xs text-slate-500">{{ periodo().fechaInicio }} - {{ periodo().fechaFin }} | {{ periodo().tipo }}</p>
 </div>
 <button (click)="close.emit()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
 </svg>
 </button>
 </div>

 <div class="px-6 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
 <div class="grid grid-cols-4 gap-4 text-center text-sm">
 <div>
 <p class="text-xs text-slate-500 uppercase font-bold">Total Devengado</p>
 <p class="text-lg font-bold text-slate-700">\${{ periodo().totalDevengado | number:'1.0-0' }}</p>
 </div>
 <div>
 <p class="text-xs text-slate-500 uppercase font-bold">Deducciones</p>
 <p class="text-lg font-bold text-red-600">\${{ periodo().totalDeducciones | number:'1.0-0' }}</p>
 </div>
 <div>
 <p class="text-xs text-slate-500 uppercase font-bold">Neto a Pagar</p>
 <p class="text-lg font-bold text-green-600">\${{ periodo().totalNeto | number:'1.0-0' }}</p>
 </div>
 <div>
 <p class="text-xs text-slate-500 uppercase font-bold">Costo Empresa</p>
 <p class="text-lg font-bold text-blue-600">\${{ periodo().totalCostoEmpresa | number:'1.0-0' }}</p>
 </div>
 </div>
 </div>

 <div class="overflow-y-auto flex-1 p-6">
 <table class="w-full text-sm">
 <thead class="bg-slate-50 text-slate-600 text-xs font-bold uppercase ">
 <tr>
 <th class="px-3 py-2 text-left">Empleado</th>
 <th class="px-3 py-2 text-right">Devengado</th>
 <th class="px-3 py-2 text-right">Salud</th>
 <th class="px-3 py-2 text-right">Pensión</th>
 <th class="px-3 py-2 text-right">Retefte</th>
 <th class="px-3 py-2 text-right">Neto</th>
 <th class="px-3 py-2 text-right">IBC</th>
 <th class="px-3 py-2 text-right">Costo Emp.</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-slate-100">
 @for (liq of liquidaciones(); track liq.id) {
 <tr class="hover:bg-slate-50">
 <td class="px-3 py-2 font-medium">{{ liq.empleado?.primerNombre }} {{ liq.empleado?.primerApellido }}</td>
 <td class="px-3 py-2 font-mono text-right">\${{ liq.totalDevengado | number:'1.0-0' }}</td>
 <td class="px-3 py-2 font-mono text-right">\${{ liq.saludEmpleado | number:'1.0-0' }}</td>
 <td class="px-3 py-2 font-mono text-right">\${{ liq.pensionEmpleado | number:'1.0-0' }}</td>
 <td class="px-3 py-2 font-mono text-right">\${{ liq.retencionFuente | number:'1.0-0' }}</td>
 <td class="px-3 py-2 font-mono text-right font-bold text-green-600">\${{ liq.netoPagar | number:'1.0-0' }}</td>
 <td class="px-3 py-2 font-mono text-right text-slate-500">\${{ liq.ibc | number:'1.0-0' }}</td>
 <td class="px-3 py-2 font-mono text-right text-blue-600">\${{ (liq.totalDevengado + liq.totalAportes + liq.totalProvisiones) | number:'1.0-0' }}</td>
 </tr>
 }
 </tbody>
 </table>

 @if (periodo().dianEstado && periodo().dianEstado !== 'NO_ENVIADA') {
 <div class="mt-6 border-t border-slate-200 pt-4">
 <h4 class="text-sm font-bold text-slate-600 uppercase mb-3">Nómina Electrónica DIAN</h4>
 <div class="grid grid-cols-3 gap-4 text-sm">
 <div>
 <p class="text-xs text-slate-500 uppercase font-bold">Estado</p>
 <p class="font-bold" [class.text-green-600]="periodo().dianEstado === 'ACEPTADA'"
 [class.text-yellow-600]="periodo().dianEstado === 'ENVIADA'">{{ periodo().dianEstado }}</p>
 </div>
 <div>
 <p class="text-xs text-slate-500 uppercase font-bold">CUNE</p>
 <p class="text-xs font-mono break-all">{{ periodo().dianCune || '-' }}</p>
 </div>
 <div>
 <p class="text-xs text-slate-500 uppercase font-bold">No. Nómina</p>
 <p class="font-mono">{{ periodo().dianNumero || '-' }}</p>
 </div>
 </div>
 </div>
 }

 @if (pagos().length) {
 <div class="mt-6 border-t border-slate-200 pt-4">
 <h4 class="text-sm font-bold text-slate-600 uppercase mb-3">Pagos realizados</h4>
 <table class="w-full text-sm">
 <thead class="bg-slate-50 text-slate-600 text-xs font-bold uppercase ">
 <tr>
 <th class="px-3 py-2 text-left">Fecha</th>
 <th class="px-3 py-2 text-left">Cuenta</th>
 <th class="px-3 py-2 text-left">Comprobante</th>
 <th class="px-3 py-2 text-right">Valor</th>
 <th class="px-3 py-2 text-left">Observaciones</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-slate-100">
 @for (p of pagos(); track p.id) {
 <tr class="hover:bg-slate-50">
 <td class="px-3 py-2">{{ p.fechaPago }}</td>
 <td class="px-3 py-2 font-mono text-xs">{{ p.cuentaCodigoContable }}</td>
 <td class="px-3 py-2 text-xs">{{ p.numeroComprobante || '-' }}</td>
 <td class="px-3 py-2 font-mono text-right text-green-600 font-bold">\${{ p.valor | number:'1.0-0' }}</td>
 <td class="px-3 py-2 text-xs text-slate-500">{{ p.observaciones || '-' }}</td>
 </tr>
 }
 </tbody>
 </table>
 </div>
 }
 </div>
 </div>
 </div>
 `
})
export class DetalleLiquidacionModalComponent {
 periodo = input.required<PeriodoNomina>();
 liquidaciones = input<Liquidacion[]>([]);
 pagos = input<PagoNomina[]>([]);
 close = output();
}
