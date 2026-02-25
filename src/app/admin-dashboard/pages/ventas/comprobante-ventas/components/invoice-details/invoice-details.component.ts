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
  ) { }

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
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar la factura');
        this.loading.set(false);
      }
    });
  }

  getStatusClass(status: InvoiceStatus): string {
    const classes: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-300',
      [InvoiceStatus.PENDING_DIAN]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      [InvoiceStatus.ACCEPTED]: 'bg-green-100 text-green-800 border-green-300',
      [InvoiceStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-300',
      [InvoiceStatus.PAID]: 'bg-blue-100 text-blue-800 border-blue-300',
      [InvoiceStatus.CANCELLED]: 'bg-gray-500 text-gray-800 border-gray-300',
      [InvoiceStatus.ISSUED]: 'bg-blue-100 text-blue-800 border-blue-300',
      [InvoiceStatus.ERROR_ASIENTO]: 'bg-red-100 text-red-800 border-red-300'
    };
    return classes[status];
  }

  getStatusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'Borrador',
      [InvoiceStatus.PENDING_DIAN]: 'Pendiente DIAN',
      [InvoiceStatus.ACCEPTED]: 'Aceptada',
      [InvoiceStatus.REJECTED]: 'Rechazada',
      [InvoiceStatus.PAID]: 'Pagada',
      [InvoiceStatus.CANCELLED]: 'Cancelada',
      [InvoiceStatus.ISSUED]: 'Emitida',
      [InvoiceStatus.ERROR_ASIENTO]: 'Error Asiento'
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
