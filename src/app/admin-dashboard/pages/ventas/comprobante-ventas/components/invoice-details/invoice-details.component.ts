import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FacturaVenta, InvoiceStatus } from '@dashboard/interfaces/documento-venta-interface';
import { ComprobantesVentasService } from '@dashboard/pages/ventas/services/comprobantes-ventas.service';

@Component({
  selector: 'app-invoice-details',
  imports: [CommonModule, RouterLink],
  templateUrl: './invoice-details.component.html',
})
export class InvoiceDetailsComponent {
          factura = signal<FacturaVenta | null>(null);
          loading = signal(true);
          error = signal<string | null>(null);

          constructor(
            private facturasService: ComprobantesVentasService,
            private route: ActivatedRoute
          ) {}

          ngOnInit(): void {
            const id = this.route.snapshot.params['id'];
            this.loadInvoice(id);
          }

          loadInvoice(id: string): void {
            this.loading.set(true);
            this.error.set(null);

            this.facturasService.getInvoiceById(id).subscribe({
              next: (response) => {
                this.factura.set(response.data[0]);
                console.log("Factura ID: ", this.factura())
                console.log("RESPONSE ID: ", response)
                this.loading.set(false);
              },
              error: (err) => {
                this.error.set('Error al cargar la factura');
                this.loading.set(false);
                console.error('Error:', err);
              }
            });
          }

          getStatusClass(status: InvoiceStatus): string {
            const classes: Record<InvoiceStatus, string> = {
              [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-300',
              [InvoiceStatus.ISSUED]: 'bg-blue-100 text-blue-800 border-blue-300',
              [InvoiceStatus.PAID]: 'bg-green-100 text-green-800 border-green-300',
              [InvoiceStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-300'
            };
            return classes[status];
          }

          getStatusLabel(status: InvoiceStatus): string {
            const labels: Record<InvoiceStatus, string> = {
              [InvoiceStatus.DRAFT]: 'Borrador',
              [InvoiceStatus.ISSUED]: 'Emitida',
              [InvoiceStatus.PAID]: 'Pagada',
              [InvoiceStatus.CANCELLED]: 'Cancelada'
            };
            return labels[status];
          }

          formatCurrency(value: number): string {
            return new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0
            }).format(value);
          }

          formatDate(date: string | Date): string {
            return new Date(date).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }

          print(): void {
            window.print();
          }

          exportPDF(): void {
            // Implementar exportación a PDF
            console.log('Exportar a PDF');
          }
 }
