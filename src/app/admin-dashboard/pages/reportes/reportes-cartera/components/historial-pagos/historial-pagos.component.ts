import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { HistorialPagosResponse } from '@dashboard/interfaces/pagos-interface';

@Component({
 selector: 'app-historial-pagos',
 imports: [CurrencyPipe, DatePipe, CommonModule],
 standalone: true,
 templateUrl: './historial-pagos.component.html',
})
export class HistorialPagosComponent {
 historial = input.required<HistorialPagosResponse>();
 loadingActual = input.required<boolean>();


}
