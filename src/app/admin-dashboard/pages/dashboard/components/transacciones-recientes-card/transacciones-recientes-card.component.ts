import { Component, input } from '@angular/core';
import { RecentTransaction } from '@dashboard/interfaces/dashboard.interface';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-transacciones-recientes-card',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './transacciones-recientes-card.component.html',
})
export class TransaccionesRecientesCard {
  recentTransactions = input.required<RecentTransaction[]>();
}
