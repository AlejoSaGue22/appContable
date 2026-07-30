import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodoNomina } from '../../../interfaces/nomina.interface';

@Component({
  selector: 'app-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pago-modal.component.html',
})
export class PagoModalComponent {
  periodo = input.required<PeriodoNomina>();

  close = output<void>();
  confirmar = output<{ fechaPago: string; cuentaCodigoContable: string; numeroComprobante?: string; observaciones?: string }>();

  pagoFecha = signal(new Date().toISOString().split('T')[0]);
  pagoCuentaCodigo = signal('1110');
  pagoNumeroComprobante = signal('');
  pagoObservaciones = signal('');

  onConfirmar() {
    if (!this.pagoFecha() || !this.pagoCuentaCodigo()) return;
    this.confirmar.emit({
      fechaPago: this.pagoFecha(),
      cuentaCodigoContable: this.pagoCuentaCodigo(),
      numeroComprobante: this.pagoNumeroComprobante() || undefined,
      observaciones: this.pagoObservaciones() || undefined,
    });
  }
}
