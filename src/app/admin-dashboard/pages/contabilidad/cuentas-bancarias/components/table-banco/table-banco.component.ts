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

  onEdit(cuenta: CuentaBancaria) {
    this.openEditModal.emit(cuenta);
  }

  onDelete(id: string) {
    this.deleteCuenta.emit(id);
  }

 }
