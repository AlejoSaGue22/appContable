import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NominaService } from '../services/nomina.service';
import { PeriodoNomina, Liquidacion, PagoNomina } from '../interfaces/nomina.interface';
import { PeriodoFormModalComponent } from './components/periodo-form-modal/periodo-form-modal.component';
import { DetalleLiquidacionModalComponent } from './components/detalle-liquidacion-modal/detalle-liquidacion-modal.component';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';
import { NotificationService } from '@shared/services/notification.service';

@Component({
    selector: 'app-periodos-page',
    standalone: true,
    imports: [CommonModule, FormsModule, PeriodoFormModalComponent, DetalleLiquidacionModalComponent, HeaderTitlePageComponent],
    template: `
    <div class="p-6 space-y-6">
      <header-title-page [titleHead]="{ title: 'Períodos de Nómina', slog: 'Liquidación y gestión de nómina por período' }">
      </header-title-page>

      <div class="flex justify-end">
        <button (click)="showFormModal.set(true)" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
          + Nuevo Período
        </button>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th class="px-4 py-3 text-left">Nombre</th>
              <th class="px-4 py-3 text-left">Período</th>
              <th class="px-4 py-3 text-left">Tipo</th>
              <th class="px-4 py-3 text-right">Devengado</th>
              <th class="px-4 py-3 text-right">Deducciones</th>
              <th class="px-4 py-3 text-right">Neto</th>
              <th class="px-4 py-3 text-center">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (p of periodos(); track p.id) {
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-medium">{{ p.nombre }}</td>
                <td class="px-4 py-3 text-xs text-slate-600">{{ p.fechaInicio }} - {{ p.fechaFin }}</td>
                <td class="px-4 py-3 text-xs">{{ p.tipo }}</td>
                <td class="px-4 py-3 font-mono text-right">\${{ p.totalDevengado | number:'1.0-0' }}</td>
                <td class="px-4 py-3 font-mono text-right text-red-600">\${{ p.totalDeducciones | number:'1.0-0' }}</td>
                <td class="px-4 py-3 font-mono text-right text-green-600 font-bold">\${{ p.totalNeto | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                    [class.bg-yellow-100]="p.estado === 'BORRADOR'"
                    [class.text-yellow-700]="p.estado === 'BORRADOR'"
                    [class.bg-green-100]="p.estado === 'LIQUIDADA'"
                    [class.text-green-700]="p.estado === 'LIQUIDADA'"
                    [class.bg-blue-100]="p.estado === 'PAGADA'"
                    [class.text-blue-700]="p.estado === 'PAGADA'"
                    [class.bg-red-100]="p.estado === 'ANULADA'"
                    [class.text-red-700]="p.estado === 'ANULADA'">
                    {{ p.estado }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  @if (p.estado === 'BORRADOR') {
                    <button (click)="liquidar(p)" class="text-green-600 hover:text-green-800 text-xs font-bold mr-3">Liquidar</button>
                  }
                  @if (p.estado === 'LIQUIDADA') {
                    <button (click)="prepararPago(p)" class="text-indigo-600 hover:text-indigo-800 text-xs font-bold mr-3">Pagar</button>
                    <button (click)="anular(p)" class="text-red-600 hover:text-red-800 text-xs font-bold mr-3">Anular</button>
                    <button (click)="verDetalle(p)" class="text-blue-600 hover:text-blue-800 text-xs font-bold mr-3">Ver</button>
                  }
                  @if (p.estado === 'PAGADA' || p.estado === 'LIQUIDADA') {
                    @if (p.dianEstado === 'NO_ENVIADA') {
                      <button (click)="enviarDian(p)" class="text-purple-600 hover:text-purple-800 text-xs font-bold mr-3">Enviar DIAN</button>
                    }
                    @if (p.dianEstado === 'ENVIADA' || p.dianEstado === 'ACEPTADA') {
                      <span class="text-xs font-bold mr-3" [class.text-green-600]="p.dianEstado === 'ACEPTADA'" [class.text-yellow-600]="p.dianEstado === 'ENVIADA'">
                        DIAN: {{ p.dianEstado }}
                      </span>
                      <button (click)="descargarXml(p)" class="text-purple-600 hover:text-purple-800 text-xs font-bold mr-3">XML</button>
                    }
                  }
                  @if (p.estado === 'PAGADA') {
                    <button (click)="verDetalle(p)" class="text-blue-600 hover:text-blue-800 text-xs font-bold mr-3">Ver</button>
                    <button (click)="anular(p)" class="text-red-600 hover:text-red-800 text-xs font-bold mr-3">Anular</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="px-4 py-8 text-center text-slate-400">No hay períodos creados</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (showFormModal()) {
        <app-periodo-form-modal (close)="showFormModal.set(false)" (saved)="onPeriodoSaved()" />
      }

      @if (showDetalleModal()) {
        <app-detalle-liquidacion-modal
          [periodo]="selectedPeriodo()!"
          [liquidaciones]="liquidaciones()"
          [pagos]="pagos()"
          (close)="showDetalleModal.set(false)" />
      }

      @if (showPagoModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click.self)="showPagoModal.set(false)">
          <div class="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <h3 class="text-lg font-bold">Pagar Nómina</h3>
            <p class="text-sm text-slate-600">Período: <strong>{{ periodoPagar()?.nombre }}</strong></p>
            <p class="text-sm text-slate-600">Neto a pagar: <strong>\${{ periodoPagar()?.totalNeto | number:'1.0-0' }}</strong></p>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Fecha de pago</label>
              <input type="date" [(ngModel)]="pagoFecha" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Código cuenta contable (ej: 1110)</label>
              <input type="text" [(ngModel)]="pagoCuentaCodigo" placeholder="1110" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">No. Comprobante <span class="text-slate-400">(opcional)</span></label>
              <input type="text" [(ngModel)]="pagoNumeroComprobante" placeholder="Ej: TRANSF-001" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Observaciones <span class="text-slate-400">(opcional)</span></label>
              <textarea [(ngModel)]="pagoObservaciones" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"></textarea>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button (click)="showPagoModal.set(false)" class="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800">Cancelar</button>
              <button (click)="pagar()" [disabled]="!pagoFecha || !pagoCuentaCodigo" class="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                Pagar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export default class PeriodosPageComponent {
    private nominaService = inject(NominaService);
    private loader = inject(LoaderService);
    private notification = inject(NotificationService);

    periodos = signal<PeriodoNomina[]>([]);
    liquidaciones = signal<Liquidacion[]>([]);
    pagos = signal<PagoNomina[]>([]);
    selectedPeriodo = signal<PeriodoNomina | null>(null);
    showFormModal = signal(false);
    showDetalleModal = signal(false);
    showPagoModal = signal(false);
    periodoPagar = signal<PeriodoNomina | null>(null);
    pagoFecha = signal('');
    pagoCuentaCodigo = signal('');
    pagoNumeroComprobante = signal('');
    pagoObservaciones = signal('');

    constructor() {
        this.loadPeriodos();
    }

    loadPeriodos() {
        this.loader.show();
        this.nominaService.getPeriodos({ limit: 1000 }).subscribe({
            next: (res) => this.periodos.set(res.data),
            error: (err) => this.notification.error('Error al cargar períodos', err),
            complete: () => this.loader.hide(),
        });
    }

    onPeriodoSaved() {
        this.showFormModal.set(false);
        this.loadPeriodos();
    }

    liquidar(periodo: PeriodoNomina) {
        if (!confirm(`¿Liquidar nómina del período "${periodo.nombre}"? Esto tomará todos los empleados activos.`)) return;
        this.loader.show();
        this.nominaService.liquidarPeriodo(periodo.id, { empleados: [] }).subscribe({
            next: () => {
                this.notification.success('Nómina liquidada exitosamente');
                this.loadPeriodos();
                this.loader.hide();
            },
            error: (err) => {
                this.notification.error('Error al liquidar nómina', err);
                this.loader.hide();
            }
        });
    }

    verDetalle(periodo: PeriodoNomina) {
        this.selectedPeriodo.set(periodo);
        this.loader.show();
        this.nominaService.getLiquidaciones(periodo.id).subscribe({
            next: (res) => {
                this.liquidaciones.set(res);
                this.nominaService.getPagosByPeriodo(periodo.id).subscribe({
                    next: (pagos) => {
                        this.pagos.set(pagos);
                        this.showDetalleModal.set(true);
                        this.loader.hide();
                    },
                    error: () => this.loader.hide()
                });
            },
            error: (err) => {
                this.notification.error('Error al cargar detalle', err);
                this.loader.hide();
            }
        });
    }

    prepararPago(periodo: PeriodoNomina) {
        this.periodoPagar.set(periodo);
        this.pagoFecha.set(new Date().toISOString().split('T')[0]);
        this.pagoCuentaCodigo.set('1110');
        this.pagoNumeroComprobante.set('');
        this.pagoObservaciones.set('');
        this.showPagoModal.set(true);
    }

    pagar() {
        const periodo = this.periodoPagar();
        if (!periodo || !this.pagoFecha() || !this.pagoCuentaCodigo()) return;

        this.loader.show();
        this.showPagoModal.set(false);
        this.nominaService.pagarNomina(periodo.id, {
            fechaPago: this.pagoFecha(),
            cuentaCodigoContable: this.pagoCuentaCodigo(),
            numeroComprobante: this.pagoNumeroComprobante() || undefined,
            observaciones: this.pagoObservaciones() || undefined,
        }).subscribe({
            next: () => {
                this.notification.success('Nómina pagada exitosamente');
                this.loadPeriodos();
            },
            error: (err) => {
                this.notification.error('Error al pagar nómina', err);
                this.loader.hide();
            }
        });
    }

    enviarDian(periodo: PeriodoNomina) {
        if (!confirm(`¿Generar y enviar nómina electrónica a DIAN para "${periodo.nombre}"?`)) return;
        this.loader.show();
        this.nominaService.enviarDian(periodo.id).subscribe({
            next: () => {
                this.notification.success('Nómina electrónica generada exitosamente');
                this.loadPeriodos();
            },
            error: (err) => {
                this.notification.error('Error al enviar a DIAN', err);
                this.loader.hide();
            }
        });
    }

    descargarXml(periodo: PeriodoNomina) {
        this.loader.show();
        this.nominaService.descargarXmlDian(periodo.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Nomina_${periodo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.xml`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.loader.hide();
            },
            error: (err) => {
                this.notification.error('Error al descargar XML', err);
                this.loader.hide();
            }
        });
    }

    anular(periodo: PeriodoNomina) {
        if (!confirm(`¿Anular la nómina del período "${periodo.nombre}"? Se revertirán los asientos contables.`)) return;
        this.loader.show();
        this.nominaService.anularNomina(periodo.id).subscribe({
            next: () => {
                this.notification.success('Nómina anulada exitosamente');
                this.loadPeriodos();
            },
            error: (err) => {
                this.notification.error('Error al anular nómina', err);
                this.loader.hide();
            }
        });
    }
}
