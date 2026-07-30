import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NominaService } from '../services/nomina.service';
import { PeriodoNomina, Liquidacion, PagoNomina } from '../interfaces/nomina.interface';
import { PeriodoFormModalComponent } from './components/periodo-form-modal/periodo-form-modal.component';
import { DetalleLiquidacionModalComponent } from './components/detalle-liquidacion-modal/detalle-liquidacion-modal.component';
import { PeriodosTableComponent } from './components/periodos-table/periodos-table.component';
import { PagoModalComponent } from './components/pago-modal/pago-modal.component';
import { PeriodoEmpleadosModalComponent } from './components/periodo-empleados-modal/periodo-empleados-modal.component';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '@shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-periodos-page',
  standalone: true,
  imports: [
    CommonModule,
    PeriodoFormModalComponent,
    DetalleLiquidacionModalComponent,
    PeriodosTableComponent,
    PagoModalComponent,
    PeriodoEmpleadosModalComponent,
    HeaderTitlePageComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './periodos-page.component.html',
})
export default class PeriodosPageComponent {
  private nominaService = inject(NominaService);
  private loader = inject(LoaderService);
  private notification = inject(NotificationService);

  periodos = signal<PeriodoNomina[]>([]);
  liquidaciones = signal<Liquidacion[]>([]);
  pagos = signal<PagoNomina[]>([]);
  selectedPeriodo = signal<PeriodoNomina | null>(null);
  periodoPagar = signal<PeriodoNomina | null>(null);
  periodoGestionar = signal<PeriodoNomina | null>(null);

  showFormModal = signal(false);
  showDetalleModal = signal(false);
  showPagoModal = signal(false);
  showEmpleadosModal = signal(false);

  // Modal de confirmación genérico
  confirmModal = signal<ConfirmModalConfig | null>(null);
  private confirmCallback: (() => void) | null = null;

  headTitle = {
    title: 'Períodos de Nómina',
    slog: 'Liquidación y gestión de nómina por período',
  };

  constructor() {
    this.loadPeriodos();
  }

  /** Abre el modal de confirmación con la config dada y guarda el callback a ejecutar si confirma */
  private pedirConfirmacion(config: ConfirmModalConfig, onConfirm: () => void) {
    this.confirmModal.set(config);
    this.confirmCallback = onConfirm;
  }

  onConfirmado() {
    this.confirmCallback?.();
    this.confirmModal.set(null);
    this.confirmCallback = null;
  }

  onCancelado() {
    this.confirmModal.set(null);
    this.confirmCallback = null;
  }

  loadPeriodos() {
    this.loader.show();
    this.nominaService.getPeriodos({ limit: 1000 }).subscribe({
      next: (res) => this.periodos.set(res.data),
      error: (err) => this.notification.error(err, 'Error al cargar períodos'),
      complete: () => this.loader.hide(),
    });
  }

  onPeriodoSaved() {
    this.showFormModal.set(false);
    this.loadPeriodos();
  }

  gestionarEmpleados(periodo: PeriodoNomina) {
    this.periodoGestionar.set(periodo);
    this.showEmpleadosModal.set(true);
  }

  liquidar(periodo: PeriodoNomina) {
    this.pedirConfirmacion(
      {
        title: 'Liquidar Nómina',
        message: `¿Desea liquidar la nómina del período "${periodo.nombre}"?`,
        detail: 'Esta acción procesará los conceptos recurrentes y deducciones legales congelando un snapshot estático.',
        icon: 'warning',
        confirmLabel: 'Sí, Liquidar',
        confirmClass: 'bg-green-600 hover:bg-green-700',
      },
      () => {
        this.loader.show();
        this.nominaService.liquidarPeriodo(periodo.id, { empleados: [] }).subscribe({
          next: () => {
            this.notification.success('Nómina liquidada exitosamente con snapshot congelado');
            this.loadPeriodos();
            this.loader.hide();
          },
          error: (err) => {
            this.notification.error('Error al liquidar nómina', err);
            this.loader.hide();
          },
        });
      }
    );
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
          error: () => this.loader.hide(),
        });
      },
      error: (err) => {
        this.notification.error('Error al cargar detalle', err);
        this.loader.hide();
      },
    });
  }

  prepararPago(periodo: PeriodoNomina) {
    this.periodoPagar.set(periodo);
    this.showPagoModal.set(true);
  }

  onPagoConfirmado(datos: { fechaPago: string; cuentaCodigoContable: string; numeroComprobante?: string; observaciones?: string }) {
    const periodo = this.periodoPagar();
    if (!periodo) return;

    this.loader.show();
    this.showPagoModal.set(false);
    this.nominaService.pagarNomina(periodo.id, datos).subscribe({
      next: () => {
        this.notification.success('Nómina pagada exitosamente');
        this.loadPeriodos();
      },
      error: (err) => {
        this.notification.error('Error al pagar nómina', err);
        this.loader.hide();
      },
    });
  }

  enviarDian(periodo: PeriodoNomina) {
    this.pedirConfirmacion(
      {
        title: 'Enviar a DIAN',
        message: `¿Desea enviar la nómina electrónica del período "${periodo.nombre}" a la DIAN?`,
        detail: 'Se generará el documento XML y se transmitirá al sistema de nómina electrónica.',
        icon: 'info',
        confirmLabel: 'Sí, Enviar',
        confirmClass: 'bg-purple-600 hover:bg-purple-700',
      },
      () => {
        this.loader.show();
        this.nominaService.enviarDian(periodo.id).subscribe({
          next: () => {
            this.notification.success('Nómina electrónica generada exitosamente');
            this.loadPeriodos();
          },
          error: (err) => {
            this.notification.error('Error al enviar a DIAN', err);
            this.loader.hide();
          },
        });
      }
    );
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
      },
    });
  }

  anular(periodo: PeriodoNomina) {
    this.pedirConfirmacion(
      {
        title: 'Anular Nómina',
        message: `¿Está seguro de anular la nómina del período "${periodo.nombre}"?`,
        detail: 'Esta acción revertirá todos los asientos contables generados. No se puede deshacer.',
        icon: 'danger',
        confirmLabel: 'Sí, Anular',
        confirmClass: 'bg-red-600 hover:bg-red-700',
      },
      () => {
        this.loader.show();
        this.nominaService.anularNomina(periodo.id).subscribe({
          next: () => {
            this.notification.success('Nómina anulada exitosamente');
            this.loadPeriodos();
          },
          error: (err) => {
            this.notification.error('Error al anular nómina', err);
            this.loader.hide();
          },
        });
      }
    );
  }
}
