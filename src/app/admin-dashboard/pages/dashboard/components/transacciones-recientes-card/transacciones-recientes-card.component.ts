import { Component, input } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { RecentTransaction } from '@dashboard/interfaces/dashboard.interface';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
 selector: 'app-transacciones-recientes-card',
 imports: [DatePipe, CurrencyPipe, EmptyStateComponent],
 templateUrl: './transacciones-recientes-card.component.html',
})
export class TransaccionesRecientesCard {
 recentTransactions = input.required<RecentTransaction[]>();
}
