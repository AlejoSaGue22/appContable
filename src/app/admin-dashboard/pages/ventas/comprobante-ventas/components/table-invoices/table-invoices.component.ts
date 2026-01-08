import { Component, input } from '@angular/core';
import { FacturaVenta, InvoiceStatus } from '@dashboard/interfaces/documento-venta-interface';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-table-invoices',
  imports: [RouterLink],
  templateUrl: './table-invoices.component.html',
})
export class TableInvoices {

  invoiceData = input.required<FacturaVenta[]>();

  get invoiceDataArray(): FacturaVenta[] {
    const data = this.invoiceData();

    return Array.isArray(data) ? data : [data];
  }

  readonly statuses = [
    { value: '', label: 'Todos los estados' },
    { value: InvoiceStatus.DRAFT, label: 'Borrador' },
    { value: InvoiceStatus.ISSUED, label: 'Emitida' },
    { value: InvoiceStatus.PAID, label: 'Pagada' },
    { value: InvoiceStatus.CANCELLED, label: 'Cancelada' }
  ];

  getStatusClass(status: InvoiceStatus): string {
    const classes: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [InvoiceStatus.ISSUED]: 'bg-blue-100 text-blue-800',
      [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
      [InvoiceStatus.CANCELLED]: 'bg-red-100 text-red-800'
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
      month: 'short',
      day: 'numeric'
    });
  }
  
 }
