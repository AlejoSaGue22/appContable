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
  /** El item de CxC o CxP seleccionado */
  historialItem = input<CxcItem | CxpItem | null>(null);
  
  /** Lista de pagos/cobros cargados */
  historialPagos = input<PagoHistorial[]>([]);

  /** true mientras se espera la respuesta del servidor */
  historialLoading = input(false);

  /** Controla el color/texto del resumen ('cobro' → verde, 'pago' → naranja) */
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
}
