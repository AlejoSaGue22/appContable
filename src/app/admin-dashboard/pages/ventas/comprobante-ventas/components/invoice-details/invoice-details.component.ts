import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DianStatus, FormaPago, GetFacturaRequest, InvoiceStatus, TipoFactura } from '@dashboard/interfaces/documento-venta-interface';
import { PagoHistorial, PaymentStatus } from '@dashboard/interfaces/pagos-interface';
import { RegistrarPagoModalData } from '@dashboard/pages/pagos/components/modal-registrarpago/modal-registrarpago.component';
import { PagosHttpService } from '@dashboard/pages/pagos/services/pagos.service';
import { ComprobantesVentasService } from '@dashboard/pages/ventas/services/comprobantes-ventas.service';
import { AsientosHttpService } from '@dashboard/services/asientos-http.service';
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-invoice-details',
  imports: [CommonModule, RouterLink],
  templateUrl: './invoice-details.component.html',
})
export class InvoiceDetailsComponent {
  factura = signal<GetFacturaRequest | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  asientos: any[] = [];
  cobros: PagoHistorial[] = [];
  loadingAsientos = false;
  modalCobroVisible = false;
  modalCobroData: RegistrarPagoModalData | null = null;

  constructor(
    private facturasService: ComprobantesVentasService,
    private route: ActivatedRoute,
    private pagosService: PagosHttpService,
    private asientosService: AsientosHttpService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadInvoice(id);
  }
  
  cargarDatosContables(): void {
    const id = this.factura()!.id;
  
    // Cargar asientos de esta factura
    this.loadingAsientos = true;
    this.asientosService.getByReferencia(this.factura()!.comprobante_completo).subscribe({
      next:  a  => { this.asientos = a; this.loadingAsientos = false; },
      error: () => { this.loadingAsientos = false; },
    });
  
    // Cargar historial de cobros (solo si es crédito)
    if (this.factura()!.formaPago === FormaPago.CREDITO) {
      this.pagosService.getHistorialCobros(id).subscribe({
        next: c => { this.cobros = c; },
      });
    }
  }
  
  // ── Modal de cobro ────────────────────────────────────────────────────
  abrirCobro(): void {
    const f = this.factura()!;
    this.modalCobroData = {
      tipo:            'cobro',
      documentoId:     f.id,
      numeroDocumento: f.comprobante_completo,
      contraparte:     `${f.client.nombre} ${f.client.apellido}`,
      total:           f.total,
      saldoPendiente:  f.saldoPendiente ?? f.total,
    };
    this.modalCobroVisible = true;
  }
  
  onCobroExitoso(_result: any): void {
    this.modalCobroVisible = false;
    // this.cargarFactura(); // recarga la factura para actualizar saldos
  }
  
  // ── Reintentar asiento ────────────────────────────────────────────────
  reintentarAsiento(): void {
    this.facturasService.reintentarAsiento(this.factura()!.id).subscribe({
      next: () => { this.loadInvoice(this.factura()!.id); },
      error: (error) => {
        this.notificationService.error(error.message || 'Ocurrio un error al reintentar asiento', 'Error');
      }
    });
  }
  
  // ── Helpers labels ────────────────────────────────────────────────────
  getPaymentStatusLabel(status: PaymentStatus | null | undefined): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente de cobro',
      parcial: 'Pago parcial',
      pagado:    'Pagado',
      vencida: 'Vencida',
    };
    return status ? (map[status] ?? status) : '—';
  }
  
  getTipoAsientoLabel(tipo: string): string {
    const map: Record<string, string> = {
      FACTURA_VENTA:           'Venta',
      COBRO:                   'Cobro CxC',
      ANULACION_FACTURA_VENTA: 'Anulación',
      PAGO_FACTURA_VENTA:      'Cobro',
    };
    return map[tipo] ?? tipo;
  }


  loadInvoice(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.facturasService.getInvoiceById(id).subscribe({
      next: (response) => {
        this.factura.set(response.data[0]);
        this.loading.set(false);
        this.cargarDatosContables();
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

  getDianStatusClass(status: DianStatus): string {
    const classes: Record<DianStatus, string> = {
      [DianStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      [DianStatus.SENT]: 'bg-blue-50 text-blue-700 border-blue-200',
      [DianStatus.PROCESSING]: 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse',
      [DianStatus.ACCEPTED]: 'bg-green-100 text-green-800 border-green-300',
      [DianStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-300',
      [DianStatus.CANCELLED]: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getDianStatusLabel(status: DianStatus): string {
    const labels: Record<DianStatus, string> = {
      [DianStatus.PENDING]: 'Pendiente envío',
      [DianStatus.SENT]: 'Enviada',
      [DianStatus.PROCESSING]: 'Procesando',
      [DianStatus.ACCEPTED]: 'Aceptada por DIAN',
      [DianStatus.REJECTED]: 'Rechazada por DIAN',
      [DianStatus.CANCELLED]: 'Anulada'
    };
    return labels[status] || status;
  }

  getTipoFacturaLabel(tipo: TipoFactura): string {
    const labels: Record<TipoFactura, string> = {
      [TipoFactura.ELECTRONICA]: 'Factura Electrónica',
      [TipoFactura.STANDARD]: 'Factura de Venta',
    };
    return labels[tipo] || tipo;
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
    // Log removed

  }
}
