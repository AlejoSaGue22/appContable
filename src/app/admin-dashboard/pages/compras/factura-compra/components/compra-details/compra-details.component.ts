import { CommonModule } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormaPago } from '@dashboard/interfaces/documento-venta-interface';
import { PagoHistorial, PaymentStatus } from '@dashboard/interfaces/pagos-interface';
import { FacturaCompraService } from '@dashboard/pages/compras/services/factura-compra.service';
import { RegistrarPagoModalData } from '@dashboard/pages/pagos/components/modal-registrarpago/modal-registrarpago.component';
import { PagosHttpService } from '@dashboard/pages/pagos/services/pagos.service';
import { AsientosHttpService } from '@dashboard/services/asientos-http.service';

@Component({
  selector: 'app-compra-details',
  imports: [CommonModule, RouterLink],
  templateUrl: './compra-details.component.html',
  standalone: true
})
export class CompraDetailsComponent implements OnInit {
  compra = signal<any | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
 
  // ── Datos contables ───────────────────────────────────────────────
  asientos:       any[]           = [];
  pagos:          PagoHistorial[] = [];
  loadingAsientos = false;

  // ── Modal de pago ─────────────────────────────────────────────────
  modalPagoVisible = false;
  modalPagoData: RegistrarPagoModalData | null = null;

  constructor(
    private facturasService: FacturaCompraService,
    private route: ActivatedRoute,
    private asientosService: AsientosHttpService,
    private pagosService:   PagosHttpService,
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadCompra(id);
    } else {
      this.error.set('ID de compra no encontrado');
      this.loading.set(false);
    }
  }

  loadCompra(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.facturasService.getFacturaCompraById(id).subscribe((response) => {
      this.loading.set(false)
      if (!response.success) {
        this.error.set(response.error.message || 'Error al cargar la factura de compra');
        return;
      }

      this.compra.set(response.data.data[0]);
      this.cargarDatosContables();
    })
  }

  // ── Carga asientos contables y pagos ──────────────────────────────
  cargarDatosContables(): void {
    const c = this.compra();
    if (!c) return;
 
    // Asientos generados para esta compra (por referencia del número)
    this.loadingAsientos = true;
    this.asientosService.getByReferencia(c.numero).subscribe({
      next:  a  => { this.asientos = a; this.loadingAsientos = false; },
      error: () => { this.loadingAsientos = false; },
    });
 
    // Historial de pagos al proveedor (solo si es crédito)
    if (c.formaPago === FormaPago.CREDITO) {
      this.pagosService.getHistorialPagos(c.id).subscribe({
        next: p => { this.pagos = p; },
      });
    }
  }

  getPaymentStatusLabel(status: PaymentStatus | null | undefined): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente de pago',
      parcial: 'Pago parcial',
      pagado:    'Pagado',
      vencido: 'Vencido',
    };
    return status ? (map[status] ?? status) : '—';
  }

  getTipoAsientoLabel(tipo: string): string {
    const map: Record<string, string> = {
      GASTO:                   'Registro de Compra',
      PAGO_PROVEEDOR:          'Pago a Proveedor',
      ANULACION_FACTURA_COMPRA: 'Anulación de Compra',
    };
    return map[tipo] ?? tipo;
  }
 
  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      registrado:    'bg-blue-100 text-blue-800 border-blue-200',
      pagado:        'bg-green-100 text-green-800 border-green-200',
      borrador:      'bg-gray-100 text-gray-600 border-gray-200',
      anulado:       'bg-red-100 text-red-800 border-red-200',
      error_asiento: 'bg-amber-100 text-amber-800 border-amber-200',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  print(): void {
    window.print();
  }
}
