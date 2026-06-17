import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NotaAjusteCompra, NotaAjusteCompraStatus } from '@dashboard/interfaces/notas-ajuste-compra-interface';
import { ComprasNotasAjusteService } from '@dashboard/pages/compras/services/compras-notas-ajuste.service';
import { AsientosHttpService } from '@dashboard/services/asientos-http.service';
import { NotificationService } from '@shared/services/notification.service';
import { PrintService } from '@shared/services/print.service';

@Component({
 selector: 'app-notas-ajuste-compras-details',
 standalone: true,
 imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
 templateUrl: './notas-ajuste-details.component.html',
})
export class NotasAjusteComprasDetailsComponent implements OnInit {
 nota = signal<NotaAjusteCompra | null>(null);
 loading = signal(true);
 error = signal<string | null>(null);
 asientos: any[] = [];
 loadingAsientos = false;

 private notasService = inject(ComprasNotasAjusteService);
 private route = inject(ActivatedRoute);
 private asientosService = inject(AsientosHttpService);
 private notificationService = inject(NotificationService);
 private printService = inject(PrintService);

 ngOnInit(): void {
 const id = this.route.snapshot.params['id'];
 this.loadNota(id);
 }

 loadNota(id: string): void {
 this.loading.set(true);
 this.error.set(null);

 this.notasService.getNotaAjusteById(id).subscribe({
 next: (response) => {
 this.nota.set(response.data);
 this.loading.set(false);
 this.cargarDatosContables(); 
 },
 error: (err) => {
 this.error.set('Error al cargar la nota de ajuste de compra');
 this.loading.set(false);
 }
 });
 }

 cargarDatosContables(): void {
 const n = this.nota();
 if (!n) return;

 this.loadingAsientos = true;
 const referencia = `${n.prefijo || ''}-${n.numero}`;
 
 this.asientosService.getByReferencia(referencia).subscribe({
 next: (a) => {
 this.asientos = a;
 this.loadingAsientos = false;
 },
 error: () => {
 this.loadingAsientos = false;
 },
 });
 }

 getStatusClass(status: NotaAjusteCompraStatus): string {
 const classes: Record<NotaAjusteCompraStatus, string> = {
 [NotaAjusteCompraStatus.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-300',
 [NotaAjusteCompraStatus.REGISTRADO]: 'bg-green-100 text-green-800 border-green-300',
 [NotaAjusteCompraStatus.ANULADO]: 'bg-red-50 text-red-500 border-red-100',
 [NotaAjusteCompraStatus.ERROR_ASIENTO]: 'bg-orange-100 text-orange-800 border-orange-300',
 };
 return classes[status] || 'bg-gray-100 text-gray-800 border-gray-300';
 }

 getStatusLabel(status: NotaAjusteCompraStatus): string {
 const labels: Record<NotaAjusteCompraStatus, string> = {
 [NotaAjusteCompraStatus.DRAFT]: 'Borrador',
 [NotaAjusteCompraStatus.REGISTRADO]: 'Registrada',
 [NotaAjusteCompraStatus.ANULADO]: 'Anulada',
 [NotaAjusteCompraStatus.ERROR_ASIENTO]: 'Error Asiento',
 };
 return labels[status] || status;
 }

 formatDate(date: string | Date): string {
 if (!date) return '—';
 const dateObj = typeof date === 'string' && date.includes('-') && !date.includes('T')
 ? new Date(date.replace(/-/g, '\/'))
 : new Date(date);

 return dateObj.toLocaleDateString('es-CO', {
 year: 'numeric',
 month: 'long',
 day: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 second: '2-digit'
 });
 }

 printNota(): void {
 const n = this.nota();
 if (n) {
 this.printService.printAdjustmentNoteCompra(n);
 }
 }

 printAsiento(): void {
 const n = this.nota();
 if (n && this.asientos.length > 0) {
 this.printService.printAsientoContable(this.asientos, `${n.prefijo || ''}${n.numeroCompleto || n.id}`);
 }
 }
}
