import { Component, input, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagosHttpService } from '../../services/pagos.service';
import { AsientoPagoResponse } from '@dashboard/interfaces/pagos-interface';

@Component({
 selector: 'app-modal-asiento-contable',
 standalone: true,
 imports: [CommonModule],
 templateUrl: './modal-asiento-contable.component.html',
})
export class ModalAsientoContableComponent {
 private httpService = inject(PagosHttpService);

 pagoId = input.required<string>();
 loading = signal(true);
 data = signal<AsientoPagoResponse | null>(null);
 error = signal(false);

 Number = Number;

 constructor() {
 effect(() => {
 const id = this.pagoId();
 if (id) this.cargar(id);
 });
 }

 private cargar(id: string): void {
 this.loading.set(true);
 this.error.set(false);
 this.httpService.getAsientoDePago(id).subscribe({
 next: res => {
 this.data.set(res);
 this.loading.set(false);
 },
 error: () => {
 this.error.set(true);
 this.loading.set(false);
 },
 });
 }

 get totalDebito(): number {
 return this.data()?.detalles.reduce((s, d) => s + Number(d.debito), 0) ?? 0;
 }

 get totalCredito(): number {
 return this.data()?.detalles.reduce((s, d) => s + Number(d.credito), 0) ?? 0;
 }

 get tipoLabel(): string {
 const tipo = this.data()?.asiento?.tipo ?? '';
 const labels: Record<string, string> = {
 COBRO: 'Cobro',
 PAGO_PROVEEDOR: 'Pago a Proveedor',
 FACTURA_VENTA: 'Factura de Venta',
 GASTO: 'Gasto / Compra',
 };
 return labels[tipo] ?? tipo;
 }
}
