import { Component, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';

import { CuentasContablesService } from '../services/cuentas-contables.service';
import { LoaderComponent } from '@utils/components/loader/loader.component';

import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';

@Component({
  selector: 'app-cuentas-contables',
  standalone: true,
  imports: [CommonModule, LoaderComponent, CurrencyPipe, HeaderTitlePageComponent],
  templateUrl: './cuentas-contables.component.html'
})
export class CuentasContablesComponent {
  private cuentasService = inject(CuentasContablesService);

  headTitle: HeaderInput = {
    title: 'Catálogo de Cuentas Contables',
    slog: 'Visualización jerárquica del plan único de cuentas (PUC)'
  }

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
