import { Factura } from './../../../../interfaces/documento-venta-interface';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { ListGroupDropdownComponent } from "@shared/components/list-group-dropdown/list-group-dropdown.component";

@Component({
  selector: 'app-comprobante-ventas-forms-page',
  imports: [HeaderTitlePageComponent, ReactiveFormsModule, ListGroupDropdownComponent],
  templateUrl: './comprobante-ventas-forms-page.component.html',
})
export class ComprobanteVentasFormsPageComponent {

    headTitle: HeaderInput = {
        title: 'Crear documento de venta',
        slog: 'Registra un nuevo documento al sistema'
    }

    factura = signal<Factura | null>(null);

    private fb = inject(FormBuilder);

    formVentas = this.fb.group({
      cliente: ['', Validators.required],
      numero: ['', Validators.required],
      contacto: [''],
      vendedor: [''],
      formaPago: ['', Validators.required],
      fecha: ['', Validators.required],
      canal: [''],
      productos: [[], Validators.required]
    })

    productosItemsForm = this.fb.group({
      producto: ['', Validators.required],
      descripcion: [''],
      cantidad: [0, [Validators.required, Validators.min(1)]],
      valorUnitario: [0, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0), Validators.max(100)]],
      impuestos: [0, [Validators.min(0)]]
    })

    async onSubmit(){
        const valueFormFactura =  this.formVentas.value;
        const valueFormProductos = this.productosItemsForm.value;

        console.log("valueFormFactura: ",valueFormFactura);
        console.log("valueFormProductos: ",valueFormProductos);
        
    }
 }
