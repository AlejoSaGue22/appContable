import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NominaService } from '../../services/nomina.service';
import { PdfDesprendibleService } from '../../services/pdf-desprendible.service';
import { PeriodoNomina, Liquidacion, PagoNomina } from '../../interfaces/nomina.interface';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '@shared/components/confirm-modal/confirm-modal.component';
import { EmpresaService } from '@dashboard/services/empresa.service';

@Component({
  selector: 'app-periodo-detalle-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    HeaderTitlePageComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './periodo-detalle-page.component.html',
})
export default class PeriodoDetallePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nominaService = inject(NominaService);
  private pdfService = inject(PdfDesprendibleService);
  private empresaService = inject(EmpresaService);
  private loader = inject(LoaderService);
  private notification = inject(NotificationService);

  periodo = signal<PeriodoNomina | null>(null);
  liquidaciones = signal<Liquidacion[]>([]);
  pagos = signal<PagoNomina[]>([]);
  empresa = signal<any>(null);
  isLoading = signal(true);

  confirmModal = signal<ConfirmModalConfig | null>(null);
  private confirmCallback: (() => void) | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notification.error('Identificador del período no especificado');
      this.router.navigate(['/panel/nomina/periodos']);
      return;
    }
    this.loadData(id);
  }

  private loadData(id: string) {
    this.isLoading.set(true);
    this.loader.show();

    this.empresaService.getEmpresa().subscribe({
      next: (res: any) => {
        this.empresa.set(res?.data || res);
      },
      error: () => { },
    });

    this.nominaService.getPeriodo(id).subscribe({
      next: (p) => {
        this.periodo.set(p);
        this.nominaService.getLiquidaciones(id).subscribe({
          next: (liqs) => {
            this.liquidaciones.set(liqs);
            this.nominaService.getPagosByPeriodo(id).subscribe({
              next: (pagos) => {
                this.pagos.set(pagos);
                this.isLoading.set(false);
                this.loader.hide();
              },
              error: () => { this.isLoading.set(false); this.loader.hide(); },
            });
          },
          error: () => { this.isLoading.set(false); this.loader.hide(); },
        });
      },
      error: (err) => {
        this.notification.error('Error al cargar el período', err);
        this.isLoading.set(false);
        this.loader.hide();
      },
    });
  }

  verDetalleEmpleado(liquidacion: Liquidacion) {
    const periodoId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/panel/nomina/periodos', periodoId, 'empleado', liquidacion.empleadoId]);
  }

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

  liquidarPeriodo() {
    const periodo = this.periodo();
    if (!periodo) return;
    this.pedirConfirmacion(
      {
        title: 'Liquidar Nómina',
        message: `¿Desea liquidar la nómina del período "${periodo.nombre}"?`,
        detail: 'Esta acción procesará los conceptos recurrentes y deducciones legales.',
        icon: 'warning',
        confirmLabel: 'Sí, Liquidar',
        confirmClass: 'bg-green-600 hover:bg-green-700',
      },
      () => {
        this.loader.show();
        this.nominaService.liquidarPeriodo(periodo.id, { empleados: [] }).subscribe({
          next: () => {
            this.notification.success('Nómina liquidada exitosamente');
            this.loadData(periodo.id);
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

  anularPeriodo() {
    const periodo = this.periodo();
    if (!periodo) return;
    this.pedirConfirmacion(
      {
        title: 'Anular Nómina',
        message: `¿Está seguro de anular la nómina del período "${periodo.nombre}"?`,
        detail: 'Esta acción revertirá todos los asientos contables generados.',
        icon: 'danger',
        confirmLabel: 'Sí, Anular',
        confirmClass: 'bg-red-600 hover:bg-red-700',
      },
      () => {
        this.loader.show();
        this.nominaService.anularNomina(periodo.id).subscribe({
          next: () => {
            this.notification.success('Nómina anulada exitosamente');
            this.loadData(periodo.id);
          },
          error: (err) => {
            this.notification.error('Error al anular nómina', err);
            this.loader.hide();
          },
        });
      }
    );
  }

  descargarDesprendibles() {
    const periodo = this.periodo();
    const liqs = this.liquidaciones();
    if (!periodo || liqs.length === 0) {
      this.notification.warning('No hay liquidaciones para generar desprendibles');
      return;
    }

    this.loader.show();
    try {
      let count = 0;
      for (const liq of liqs) {
        try {
          this.pdfService.generarDesprendible(liq, periodo, this.empresa());
          count++;
        } catch (err) {
          console.error(`Error generando desprendible para ${liq.empleadoId}`, err);
        }
      }
      this.notification.success(`${count} desprendido(s) generado(s) exitosamente`);
    } catch (err: any) {
      this.notification.error('Error al descargar desprendibles', err?.message);
    } finally {
      this.loader.hide();
    }
  }

  volver() {
    this.router.navigate(['/panel/nomina/periodos']);
  }
}
