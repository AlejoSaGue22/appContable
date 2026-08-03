import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NominaService } from '../../services/nomina.service';
import { PdfDesprendibleService } from '../../services/pdf-desprendible.service';
import { Liquidacion, PeriodoNomina } from '../../interfaces/nomina.interface';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';
import { NotificationService } from '@shared/services/notification.service';
import { EmpresaService } from '@dashboard/services/empresa.service';

@Component({
  selector: 'app-empleado-detalle-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    HeaderTitlePageComponent,
  ],
  templateUrl: './empleado-detalle-page.component.html',
})
export default class EmpleadoDetallePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nominaService = inject(NominaService);
  private pdfService = inject(PdfDesprendibleService);
  private empresaService = inject(EmpresaService);
  private loader = inject(LoaderService);
  private notification = inject(NotificationService);

  periodo = signal<PeriodoNomina | null>(null);
  liquidacion = signal<Liquidacion | null>(null);
  empresa = signal<any>(null);
  isLoading = signal(true);

  ngOnInit() {
    const periodoId = this.route.snapshot.paramMap.get('id');
    const empleadoId = this.route.snapshot.paramMap.get('empleadoId');
    if (!periodoId || !empleadoId) {
      this.notification.error('Identificadores de período o empleado no especificados');
      this.router.navigate(['/panel/nomina/periodos']);
      return;
    }
    this.loadData(periodoId, empleadoId);
  }

  private loadData(periodoId: string, empleadoId: string) {
    this.isLoading.set(true);
    this.loader.show();

    this.empresaService.getEmpresa().subscribe({
      next: (res: any) => {
        this.empresa.set(res?.data || res);
      },
      error: () => { },
    });

    this.nominaService.getPeriodo(periodoId).subscribe({
      next: (p) => {
        this.periodo.set(p);
        this.nominaService.getLiquidaciones(periodoId).subscribe({
          next: (liqs) => {
            const liq = liqs.find(l => l.empleadoId === empleadoId);
            if (liq) {
              this.liquidacion.set(liq);
            } else {
              this.notification.error('No se encontró liquidación para este empleado');
            }
            this.isLoading.set(false);
            this.loader.hide();
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

  volver() {
    const periodoId = this.route.snapshot.paramMap.get('id');
    if (periodoId) {
      this.router.navigate(['/panel/nomina/periodos', periodoId, 'detalle']);
    } else {
      this.router.navigate(['/panel/nomina/periodos']);
    }
  }

  descargarColilla() {
    const liq = this.liquidacion();
    const per = this.periodo();
    if (!liq || !per) return;
    try {
      this.pdfService.generarDesprendible(liq, per, this.empresa());
      this.notification.success('Colilla de pago generada exitosamente');
    } catch (err) {
      this.notification.error('Error al generar la colilla');
    }
  }
}
