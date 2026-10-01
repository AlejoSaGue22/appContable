import { Component, input, output, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodoNomina } from '../../../interfaces/nomina.interface';
import { CuentaBancaria } from '../../../../contabilidad/interfaces/cuenta-bancaria.interface';
import { CuentasBancariasService } from '../../../../contabilidad/services/cuentas-bancarias.service';

@Component({
  selector: 'app-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pago-modal.component.html',
})
export class PagoModalComponent implements OnInit {
  periodo = input.required<PeriodoNomina>();

  close = output<void>();
  confirmar = output<{ fechaPago: string; cuentaCodigoContable: string; numeroComprobante?: string; observaciones?: string }>();

  pagoFecha = signal(new Date().toISOString().split('T')[0]);
  pagoCuentaCodigo = signal('');
  pagoNumeroComprobante = signal('');
  pagoObservaciones = signal('');

  private cuentasBancariasService = inject(CuentasBancariasService);
  private _cuentasBancarias = signal<CuentaBancaria[]>([]);

  cuentasBancariasActivas = computed(() => {
    return this._cuentasBancarias().map(c => ({
      ...c,
      codigo: c.codigoCuentaContable, // Alias for list-group-dropdown to match by valueInput
      displayName: c.banco ? `${c.banco.nombre} - ${c.nombre}` : c.nombre
    }));
  });

  ngOnInit() {
    this.loadCuentasBancarias();
  }

  loadCuentasBancarias() {
    this.cuentasBancariasService
      .getCuentasBancos({ limit: 1000, estado: 'activo' })
      .subscribe({
        next: (res) => {
          this._cuentasBancarias.set(res.cuentas);
        },
        error: (err) => console.error('Error cargando cuentas bancarias', err),
      });
  }

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
