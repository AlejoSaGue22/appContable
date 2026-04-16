import { Component, input, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CxcItem, CxpItem, PagoHistorial } from '@dashboard/interfaces/pagos-interface';

export type HistorialTipo = 'cobro' | 'pago';

@Component({
  selector: 'app-modal-historialpago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-historialpago.component.html',
})
export class ModalHistorialpagoComponent {

  historialItem = input<CxcItem | CxpItem | null>(null);
  historialPagos = input<PagoHistorial[]>([]);
  historialLoading = input(false);
  tipo = input<HistorialTipo>('cobro');

  get contraparte(): string {
    const item = this.historialItem();
    if (!item) return '';

    return 'clienteNombre' in item
      ? item.clienteNombre
      : item.proveedorNombre;
  }

  get totalPagado(): number {
    return this.historialItem()?.totalPagado ?? 0;
  }

  get saldoPendiente(): number {
    return this.historialItem()?.saldoPendiente ?? 0;
  }

  get colorAccent(): string {
    return this.tipo() === 'cobro' ? 'green' : 'orange';
  }

  formatCuentaBancaria(cuentaBancaria: PagoHistorial['cuentaBancaria']): string {
    if (!cuentaBancaria) return '—';
    return `${cuentaBancaria.banco?.nombre} - ${cuentaBancaria.numeroCuenta}`;
  }
}
