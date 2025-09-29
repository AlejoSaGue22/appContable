import { Component, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";

@Component({
  selector: 'app-productos-servicios-forms',
  imports: [HeaderTitlePageComponent],
  templateUrl: './productos-servicios-forms.component.html',
})
export class ProductosServiciosFormsComponent {

    headTitle: HeaderInput = {
            title: 'Registra un servicio o producto',
            slog: 'Nuevo registro al sistema'
    }
    
    private fb = inject(FormBuilder);

    formProductos = this.fb.group({
      categoria: [''],
      nombre: [''],
      codigo: [''],
      unidadmedida: [''],
      impuesto: [''],
      retencion: [''],
      precioventa: [[]],
      observacion: ['']
    })

    


 }
