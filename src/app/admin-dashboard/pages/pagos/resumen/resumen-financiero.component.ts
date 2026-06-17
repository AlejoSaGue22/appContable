import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PagosHttpService } from '../services/pagos.service';
import { ResumenFinancieroResponse } from '@dashboard/interfaces/pagos-interface';
import { HeaderTitlePageComponent, HeaderInput } from '@dashboard/components/header-title-page/header-title-page.component';

@Component({
 selector: 'app-resumen-financiero',
 standalone: true,
 imports: [CommonModule, RouterLink, HeaderTitlePageComponent],
 templateUrl: './resumen-financiero.component.html',
})
export class ResumenFinancieroComponent implements OnInit {
 private svc = inject(PagosHttpService);

 headTitle = signal<HeaderInput>({
 title: 'Resumen Financiero',
 slog: 'Dashboard unificado de cuentas por cobrar y pagar',
 });

 data = signal<ResumenFinancieroResponse | null>(null);
 loading = signal(true);

 ngOnInit(): void {
 this.cargar();
 }

 cargar(): void {
 this.loading.set(true);
 this.svc.getResumenFinanciero().subscribe({
 next: res => {
 this.data.set(res);
 this.loading.set(false);
 },
 error: () => this.loading.set(false),
 });
 }

 etiquetaMedio(medio: string): string {
 const labels: Record<string, string> = {
 caja: 'Caja',
 banco: 'Banco',
 transferencia: 'Transferencia',
 cheque: 'Cheque',
 };
 return labels[medio] ?? medio;
 }
}
