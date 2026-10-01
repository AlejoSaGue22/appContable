import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { ReporteAgingFlatAgrupado } from '@dashboard/interfaces/pagos-interface';

@Component({
    selector: 'app-aging-report',
    imports: [CurrencyPipe, DatePipe],
    standalone: true,
    templateUrl: './aging-report.component.html',
})
export class AgingReportComponent {
    reporte = input.required<ReporteAgingFlatAgrupado>();
    vistaActiva = input.required<string>();
    loadingActual = input.required<boolean>();
}
