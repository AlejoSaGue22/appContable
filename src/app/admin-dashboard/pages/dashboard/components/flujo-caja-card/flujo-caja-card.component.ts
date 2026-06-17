import { Component, input } from '@angular/core';
import { DashboardHistory } from '@dashboard/interfaces/dashboard.interface';
import { CurrencyPipe } from '@angular/common';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
 selector: 'app-flujo-caja-card',
 imports: [CurrencyPipe, EmptyStateComponent],
 templateUrl: './flujo-caja-card.component.html',
})
export class FlujoCajaCard {
 chartData = input.required<DashboardHistory[]>();
}
