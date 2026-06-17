import { Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { FacturaCompraService } from '@dashboard/pages/compras/services/factura-compra.service';
import { ComprobanteCompraResponse } from '@dashboard/interfaces/factura-compra-interface';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, takeUntil } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
 selector: 'app-facturas-compra-table',
 standalone: true,
 imports: [CommonModule, CurrencyPipe, DatePipe, PaginationComponent],
 templateUrl: './facturas-compra-table.component.html',
})
export class FacturasCompraTableComponent implements OnDestroy {
 fechaInicio = input<string>('');
 fechaFin = input<string>('');
 paginationService = inject(PaginationService);
 private svc = inject(FacturaCompraService);
 private notification = inject(NotificationService);
 private destroy$ = new Subject<void>();

 data = signal<ComprobanteCompraResponse | null>(null);
 loading = signal(false);
 error = signal<string | null>(null);

 constructor() {
 effect(() => {
 const inicio = this.fechaInicio();
 const fin = this.fechaFin();
 const page = this.paginationService.currentPage();
 if (inicio && fin) this.cargar(inicio, fin, page);
 });
 }

 private cargar(inicio: string, fin: string, page: number): void {
 this.loading.set(true);
 this.error.set(null);
 this.svc.getFacturasCompras({ limit: 10, page, startDate: inicio, endDate: fin })
 .pipe(takeUntil(this.destroy$))
 .subscribe({
 next: (res) => { this.data.set(res); this.loading.set(false); },
 error: () => { this.error.set('Error al cargar facturas'); this.loading.set(false); },
 });
 }

 exportarExcel(): void {
 const response = this.data();
 if (!response?.data?.length) {
 this.notification.info('Sin datos para exportar', 'Información');
 return;
 }
 const rows = response.data.map((f: any) => ({
 Fecha: f.fecha,
 'N° Comprobante': f.numero,
 'Ref. Proveedor': f.numeroFacturaProveedor || '—',
 Proveedor: f.proveedor?.razonSocial || f.proveedor?.nombre || '—',
 Subtotal: f.subtotal,
 IVA: f.iva,
 Total: f.total,
 'Saldo Pendiente': f.saldoPendiente,
 Estado: f.status,
 }));
 const ws = XLSX.utils.json_to_sheet(rows);
 const wb = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb, ws, 'Facturas Compra');
 XLSX.writeFile(wb, `FacturasCompra_${this.fechaInicio()}_${this.fechaFin()}.xlsx`);
 }

 ngOnDestroy(): void {
 this.destroy$.next();
 this.destroy$.complete();
 }
}
