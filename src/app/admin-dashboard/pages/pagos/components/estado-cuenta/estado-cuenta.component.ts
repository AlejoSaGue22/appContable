import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagosHttpService } from '../../services/pagos.service';
import { EstadoCuentaClienteResponse, EstadoCuentaProveedorResponse } from '@dashboard/interfaces/pagos-interface';

@Component({
  selector: 'app-estado-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estado-cuenta.component.html',
})
export class EstadoCuentaComponent {
  private svc = inject(PagosHttpService);

  tipo = input.required<'cliente' | 'proveedor'>();
  terceroId = signal<string | null>(null);
  inputId = '';

  data = signal<EstadoCuentaClienteResponse | EstadoCuentaProveedorResponse | null>(null);
  loading = signal(false);
  error = signal(false);

  buscar(): void {
    if (!this.inputId.trim()) return;
    this.terceroId.set(this.inputId.trim());
    this.cargar();
  }

  limpiar(): void {
    this.inputId = '';
    this.terceroId.set(null);
    this.data.set(null);
    this.loading.set(false);
    this.error.set(false);
  }

  cargar(): void {
    const documento = this.terceroId();
    if (!documento) return;

    this.loading.set(true);
    this.error.set(false);
    this.data.set(null);

    if (this.tipo() === 'cliente') {
      this.svc.getEstadoCuentaClientePorDocumento(documento).subscribe({
        next: (res: any) => {
          this.data.set(res);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    } else {
      this.svc.getEstadoCuentaProveedorPorDocumento(documento).subscribe({
        next: (res: any) => {
          this.data.set(res);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    }
  }

  etiquetaMedio(medio: string): string {
    const labels: Record<string, string> = {
      caja: 'Caja',
      banco: 'Banco',
      transferencia: 'Transferencia',
      cheque: 'Cheque',
    };
    return labels[medio] ?? medio;
  }

  etiquetaEstado(status: string): string {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      parcial: 'Parcial',
      pagado: 'Pagado',
      vencido: 'Vencido',
    };
    return labels[status] ?? status;
  }

  get totalMovimientos(): number {
    const d = this.data();
    if (!d) return 0;
    return this.tipo() === 'cliente'
      ? (d.resumen as any).totalCobros ?? 0
      : (d.resumen as any).totalPagos ?? 0;
  }
}
