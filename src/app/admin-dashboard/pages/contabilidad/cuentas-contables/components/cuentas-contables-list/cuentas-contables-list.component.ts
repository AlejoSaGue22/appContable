import { Component, computed, input } from '@angular/core';
import { GetCuentasContables } from '@dashboard/interfaces/catalogs-interface';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-cuentas-contables-list',
  imports: [CurrencyPipe],
  templateUrl: './cuentas-contables-list.component.html',
})
export class CuentasContablesList {

  cuentas = input<GetCuentasContables[]>();

  cuentasOrdenadas = computed(() => {
    return this.cuentas()?.sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

}
