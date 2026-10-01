import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NominaService } from '../services/nomina.service';
import { PeriodoNomina } from '../interfaces/nomina.interface';
import { PeriodoFormModalComponent } from './components/periodo-form-modal/periodo-form-modal.component';
import { PeriodosTableComponent } from './components/periodos-table/periodos-table.component';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '@shared/components/confirm-modal/confirm-modal.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';

@Component({
  selector: 'app-periodos-page',
  standalone: true,
  imports: [
    CommonModule,
    PeriodoFormModalComponent,
    PeriodosTableComponent,
    HeaderTitlePageComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './periodos-page.component.html',
})
export default class PeriodosPageComponent {
  private nominaService = inject(NominaService);
  private loader = inject(LoaderService);
  private notification = inject(NotificationService);
  private paginationService = inject(PaginationService);
  private router = inject(Router);

  periodos = signal<PeriodoNomina[]>([]);
  periodoGestionar = signal<PeriodoNomina | null>(null);

  currentFilters = signal<any>({});

  showFormModal = signal(false);
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

    // Merge standard pagination limit with current filters
    const params = { limit: 1000, ...this.currentFilters() };

    this.nominaService.getPeriodos(params).subscribe({
      next: (res) => {
        this.periodos.set(res.data);
        this.paginationService.totalItems.set(res.count);
        this.paginationService.pageSize.set(res.pages);
      },
      error: (err) => this.notification.error(err, 'Error al cargar períodos'),
      complete: () => this.loader.hide(),
    });
  }

  onFiltersChanged(filters: any) {
    this.currentFilters.set(filters);
    this.loadPeriodos();
  }

  onPeriodoSaved() {
    this.showFormModal.set(false);
    this.loadPeriodos();
  }

  gestionarEmpleados(periodo: PeriodoNomina) {
    this.router.navigate(['/panel/nomina/periodos', periodo.id, 'gestionar']);
  }

  liquidar(periodo: PeriodoNomina) {
    this.pedirConfirmacion({
      title: 'Liquidar Nómina',
      message: `¿Desea liquidar la nómina del período "${periodo.nombre}"?`,
      detail: 'Esta acción procesará los conceptos recurrentes y deducciones legales congelando un snapshot estático.',
      icon: 'warning',
      confirmLabel: 'Sí, Liquidar',
      confirmClass: 'bg-green-600 hover:bg-green-700',
    }, () => {
      this.loader.show();
      this.nominaService.liquidarPeriodo(periodo.id, { empleados: [] }).subscribe({
        next: () => {
          this.loader.hide();
          this.notification.info('El proceso de liquidación ha comenzado en segundo plano...');
          this.pollJobStatus(periodo.id);
        },
        error: (err) => {
          const msg = err.error?.message || err.message || 'Error desconocido';
          const finalMsg = Array.isArray(msg) ? msg.join(', ') : msg;
          this.notification.error(finalMsg, 'Error al encolar liquidación');
          this.loader.hide();
        },
        complete: () => this.loader.hide(),
      });
    }
    );
  }

  pollJobStatus(periodoId: string) {
    const intervalId = setInterval(() => {
      this.nominaService.getJobStatus(periodoId).subscribe({
        next: (res) => {
          if (res.estado === 'COMPLETADO') {
            clearInterval(intervalId);
            this.notification.success('Nómina liquidada y contabilizada exitosamente');
            this.loadPeriodos();
          } else if (res.estado === 'FALLIDO') {
            clearInterval(intervalId);
            const msg = res.errores?.message || 'Error en el procesamiento en segundo plano';
            this.notification.error(msg, 'Error en liquidación');
          } else if (res.estado === 'NINGUNO') {
            clearInterval(intervalId);
          }
        },
        error: () => {
          clearInterval(intervalId);
        }
      });
    }, 2000);
  }

  verDetalle(periodo: PeriodoNomina) {
    this.router.navigate(['/panel/nomina/periodos', periodo.id, 'detalle']);
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

  reversar(periodo: PeriodoNomina) {
    this.pedirConfirmacion(
      {
        title: 'Reversar Liquidación',
        message: `¿Está seguro de reversar la liquidación del período "${periodo.nombre}"?`,
        detail: 'Esta acción revertirá el asiento contable de provisión, eliminará las liquidaciones generadas y regresará el período a estado BORRADOR para ser calculado nuevamente.',
        icon: 'warning',
        confirmLabel: 'Sí, Reversar',
        confirmClass: 'bg-yellow-600 hover:bg-yellow-700',
      },
      () => {
        this.loader.show();
        this.nominaService.reversarLiquidacion(periodo.id).subscribe({
          next: () => {
            this.notification.success('Nómina reversada exitosamente, ahora está en BORRADOR');
            this.loadPeriodos();
          },
          error: (err) => {
            this.notification.error('Error al reversar nómina', err);
            this.loader.hide();
          },
        });
      }
    );
  }

  eliminarPeriodo(periodo: PeriodoNomina) {
    this.pedirConfirmacion(
      {
        title: 'Eliminar Período',
        message: `¿Está seguro de eliminar el período "${periodo.nombre}"?`,
        detail: 'Se perderá la selección de empleados y los conceptos ocasionales asignados a este período. Esta acción no se puede deshacer.',
        icon: 'danger',
        confirmLabel: 'Sí, Eliminar',
        confirmClass: 'bg-red-600 hover:bg-red-700',
      },
      () => {
        this.loader.show();
        this.nominaService.deletePeriodo(periodo.id).subscribe({
          next: () => {
            this.notification.success('Período eliminado exitosamente');
            this.loadPeriodos();
          },
          error: (err) => {
            const msg = err.error?.message || err.message || 'Error desconocido';
            this.notification.error(msg, 'Error al eliminar período');
            this.loader.hide();
          },
        });
      }
    );
  }
}
