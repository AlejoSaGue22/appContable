import { Component, OnInit } from '@angular/core';
import { EstadoResultados, ReportesService } from '../services/reportes.service';
import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { ReporteConciliacionDIAN, ReporteConciliacionRecaudos, ReporteFacturacionAvanzada, ReporteImpuestos } from '../../../interfaces/reportes-avanzados.interface';
import { NotificationService } from '@shared/services/notification.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reportes-general',
  imports: [CurrencyPipe, DatePipe, FormsModule, HeaderTitlePageComponent],
  templateUrl: './reportes-general.component.html',
})
export class ReportesGeneralComponent implements OnInit {
  facturacion?: ReporteFacturacionAvanzada;
  conciliacionDIAN?: ReporteConciliacionDIAN;
  conciliacionRecaudos?: ReporteConciliacionRecaudos;
  impuestos?: ReporteImpuestos;
  
  loading = false;
  activeTab: 'facturacion' | 'dian' | 'recaudos' | 'impuestos' = 'facturacion';

  fechaInicio: string;
  fechaFin: string;

  headTitle: HeaderInput = {
    title: 'Reportes Generales',
    slog: 'Análisis de rentabilidad del período'
  };

  constructor(
    private reportesService: ReportesService,
    private notificationService: NotificationService
  ) {
    // Establecer mes actual por defecto
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.fechaInicio = firstDay.toISOString().split('T')[0];
    this.fechaFin = lastDay.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.generarReporte();
  }

  generarReporte(): void {
    this.loading = true;

    forkJoin({
      facturacion: this.reportesService.getFacturacionDetallada(this.fechaInicio, this.fechaFin),
      dian: this.reportesService.getConciliacionDIAN(this.fechaInicio, this.fechaFin),
      recaudos: this.reportesService.getConciliacionRecaudos(this.fechaInicio, this.fechaFin),
      impuestos: this.reportesService.getImpuestosDetallado(this.fechaInicio, this.fechaFin)
    }).subscribe({
      next: (res) => {
        this.facturacion = res.facturacion;
        this.conciliacionDIAN = res.dian;
        this.conciliacionRecaudos = res.recaudos;
        this.impuestos = res.impuestos;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.error('Error al generar los reportes avanzados', 'Error');
      }
    });
  }

  exportarPDF(): void {
    // Implementar exportación a PDF
    this.notificationService.info('Función de exportar a PDF próximamente', 'Próximamente');
  }

  exportarExcel(): void {
    // Implementar exportación a Excel
    this.notificationService.info('Función de exportar a Excel próximamente', 'Próximamente');
  }
}
