import { Component, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';

import { CuentasContablesService } from '../services/cuentas-contables.service';
import { LoaderComponent } from '@utils/components/loader/loader.component';

@Component({
  selector: 'app-cuentas-contables',
  standalone: true,
  imports: [CommonModule, LoaderComponent, CurrencyPipe],
  templateUrl: './cuentas-contables.component.html'
})
export default class CuentasContablesComponent {
  private cuentasService = inject(CuentasContablesService);

  cuentasResource = rxResource({
    loader: () => this.cuentasService.getCuentasContables()
  });

  cuentasOrdenadas = computed(() => {
    const data = this.cuentasResource.value();
    if (!data) return [];
    
    // Sort logically by the "codigo" string
    return [...data].sort((a, b) => a.codigo.localeCompare(b.codigo));
  });
}
