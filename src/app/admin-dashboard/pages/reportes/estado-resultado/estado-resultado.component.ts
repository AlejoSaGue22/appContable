import { Component, OnInit } from '@angular/core';
import { EstadoResultados, ReportesService } from '../services/reportes.service';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';

@Component({
  selector: 'app-estado-resultado',
  imports: [CurrencyPipe, DecimalPipe, FormsModule, DatePipe, HeaderTitlePageComponent],
  templateUrl: './estado-resultado.component.html',
})
export class EstadoResultadoComponent implements OnInit {
  reporte?: EstadoResultados;
  loading = false;

  fechaInicio: string;
  fechaFin: string;

  headTitle: HeaderInput = {
    title: 'Estado de Resultados (P&L)',
    slog: 'Análisis de rentabilidad del período'
  };

  constructor(private reportesService: ReportesService) {
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

    this.reportesService.estadoResultados(this.fechaInicio, this.fechaFin).subscribe({
      next: (reporte) => {
        this.reporte = reporte;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error generando reporte:', error);
        this.loading = false;
        alert('Error al generar el reporte');
      }
    });
  }

  exportarPDF(): void {
    // Implementar exportación a PDF
    alert('Función de exportar a PDF próximamente');
  }

  exportarExcel(): void {
    // Implementar exportación a Excel
    alert('Función de exportar a Excel próximamente');
  }

  getMargenBruto(): number {
    if (!this.reporte) return 0;
    if (this.reporte.ingresos.total === 0) return 0;
    return (this.reporte.utilidadBruta / this.reporte.ingresos.total) * 100;
  }

  getMargenNeto(): number {
    if (!this.reporte) return 0;
    if (this.reporte.ingresos.total === 0) return 0;
    return (this.reporte.utilidadNeta / this.reporte.ingresos.total) * 100;
  }
}
