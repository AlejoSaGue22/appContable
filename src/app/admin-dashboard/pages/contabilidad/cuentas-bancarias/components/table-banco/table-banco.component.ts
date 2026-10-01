import { CurrencyPipe } from '@angular/common';
import { Component, input, OnInit, output } from '@angular/core';
import { CuentaBancaria } from '@dashboard/pages/contabilidad/interfaces/cuenta-bancaria.interface';

@Component({
 selector: 'app-table-banco',
 standalone: true,
 imports: [CurrencyPipe],
 templateUrl: './table-banco.component.html',
})
export class TableBancoComponent {

 cuentas = input<CuentaBancaria[]>([]);
 openEditModal = output<CuentaBancaria>();
 deleteCuenta = output<string>();
 toggleStatus = output<string>();
 movimiento = output<CuentaBancaria>();

 onEdit(cuenta: CuentaBancaria) {
 this.openEditModal.emit(cuenta);
 }

 onMovimiento(cuenta: CuentaBancaria) {
 this.movimiento.emit(cuenta);
 }

 onDelete(id: string) {
 this.deleteCuenta.emit(id);
 }

 onToggleStatus(id: string) {
 this.toggleStatus.emit(id);
 }

 }
