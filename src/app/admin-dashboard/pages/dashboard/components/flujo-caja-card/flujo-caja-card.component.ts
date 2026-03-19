import { Component, input } from '@angular/core';
import { DashboardHistory } from '@dashboard/interfaces/dashboard.interface';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-flujo-caja-card',
  imports: [CurrencyPipe],
  templateUrl: './flujo-caja-card.component.html',
})
export class FlujoCajaCard {
  chartData = input.required<DashboardHistory[]>();
}
