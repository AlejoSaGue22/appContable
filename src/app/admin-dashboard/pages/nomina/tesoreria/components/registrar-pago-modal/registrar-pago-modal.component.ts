import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObligacionNomina, PagarObligacionesDto } from '../../../interfaces/nomina.interface';
import { NominaService } from '../../../services/nomina.service';

@Component({
  selector: 'app-registrar-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-pago-modal.component.html',
  styleUrls: ['./registrar-pago-modal.component.css']
})
export class RegistrarPagoModalComponent {
  private nominaService = inject(NominaService);

  @Input() lote: ObligacionNomina[] = [];
  @Output() cerrar = new EventEmitter<void>();
  @Output() pagoRegistrado = new EventEmitter<void>();

  // Form State
  fechaPago: string = new Date().toISOString().substring(0, 10);
  cuentaCodigoContable: string = '111005'; // Default for testing
  numeroComprobante: string = '';
  observaciones: string = '';

  isSubmitting = false;
  error = '';

  get totalAbono(): number {
    return this.lote.reduce((sum, obs) => sum + Number(obs.saldo), 0);
  }

  get periodoNombre(): string {
    return this.lote.length > 0 ? (this.lote[0].periodo?.nombre || 'Período') : '';
  }

  submit() {
    if (!this.fechaPago || !this.cuentaCodigoContable) {
      this.error = 'Fecha de pago y Cuenta Contable son obligatorias';
      return;
    }

    if (this.lote.length === 0) return;

    this.isSubmitting = true;
    this.error = '';

    const periodoId = this.lote[0].periodoId;
    
    const dto: PagarObligacionesDto = {
      fechaPago: this.fechaPago,
      cuentaCodigoContable: this.cuentaCodigoContable,
      numeroComprobante: this.numeroComprobante || undefined,
      observaciones: this.observaciones || undefined,
      detalles: this.lote.map(o => ({
        obligacionId: o.id,
        valorAbono: Number(o.saldo) // Por ahora abonamos el saldo completo
      }))
    };

    this.nominaService.pagarObligaciones(periodoId, dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.pagoRegistrado.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Error al registrar el pago';
      }
    });
  }
}
