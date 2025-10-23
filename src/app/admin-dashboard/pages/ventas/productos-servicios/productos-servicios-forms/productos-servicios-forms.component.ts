import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { ProductosService } from '../../services/productos.service';
import { Router } from '@angular/router';
import { ProductosInterface } from '@dashboard/interfaces/productos-interface';

@Component({
  selector: 'app-productos-servicios-forms',
  imports: [HeaderTitlePageComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './productos-servicios-forms.component.html',
})
export class ProductosServiciosFormsComponent {

    headTitle: HeaderInput = {
            title: 'Registra un servicio o producto',
            slog: 'Nuevo registro al sistema'
    }
    
    private fb = inject(FormBuilder);
    productoService = inject(ProductosService);
    router = inject(Router);

    formProductos = this.fb.group({
      categoria: [''],
      nombre: [''],
      codigo: [''],
      unidadmedida: [''],
      impuesto: [''],
      retencion: [''],
      precioventa1: [''],
      precioventa2: [''],
      observacion: ['']
    })

    async onSubmit(){
      
      this.formProductos.markAllAsTouched();

      if(this.formProductos.invalid) return;    

      const producto = this.formProductos.value;

      console.log(producto);
      this.productoService.agregarProducto(producto as Partial<ProductosInterface>);
      this.formProductos.reset();

      await this.router.navigateByUrl('/dashboard/ventas/products_services');

    }

    onCancel(){
      this.formProductos.reset();
      this.router.navigateByUrl('/dashboard/ventas/products_services');
    }


    


 }
