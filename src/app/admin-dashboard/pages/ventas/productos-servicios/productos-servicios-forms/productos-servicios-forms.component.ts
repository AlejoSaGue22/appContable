import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { firstValueFrom, map, tap } from 'rxjs';
import { ProductosService } from '../../services/productos.service';
import { ProductosInterface } from '@dashboard/interfaces/productos-interface';
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-productos-servicios-forms',
  imports: [HeaderTitlePageComponent, ReactiveFormsModule, FormErrorLabelComponent, LoaderComponent],
  templateUrl: './productos-servicios-forms.component.html',
})
export class ProductosServiciosFormsComponent {


    headTitle: HeaderInput = {
            title: 'Registra un servicio o producto',
            slog: 'Gestiona la información de servicios y productos'
    }
    
    private fb = inject(FormBuilder);
    productoServicios = inject(ProductosService);
    notificacionService = inject(NotificationService);
    router = inject(Router);
    activateRoute = inject(ActivatedRoute);

    formProductos = this.fb.group({
          categoria: ['', Validators.required],
          nombre: ['', Validators.required],
          codigo: [''],
          unidadmedida: ['', Validators.required],
          impuesto: ['', Validators.required],
          retencion: ['', Validators.required],
          precioventa: this.fb.group({
            precio1: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
            precio2: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]]
          }),
          observacion: ['']
    })

    productosID = toSignal(
      this.activateRoute.params.pipe(map((param) => param['id']))
    );

    productoIdRxResourse = rxResource({
      request: () => ({ id: this.productosID() }),
      loader: ({ request }) => this.productoServicios.getProductoByID( request.id ).pipe(
        tap((p) => {
          this.formProductos.reset(p);
          this.formProductos.get('precioventa')?.setValue({
            precio1: p.precioventa1,
            precio2: p.precioventa2
          })
          
        })
      )
    });

    async onSubmit() {
      const valid = this.formProductos.valid;
      this.formProductos.markAllAsTouched();

      if (!valid) {
          this.notificacionService.error(
                     `Formulario incompleto`,
                     'Error',
                     5000
          );
          return
      }

      const formValue = {
        ...this.formProductos.value,
        precioventa1: this.formProductos.value.precioventa?.precio1,
        precioventa2: this.formProductos.value.precioventa?.precio2
      };
      console.log(formValue)
      delete formValue.precioventa;

      try {

        if (this.productosID() == 'new-Item') {
            const product = await firstValueFrom( this.productoServicios.agregarProducto(formValue as Partial<ProductosInterface>) );
   
            if (product.success == false) {
              this.notificacionService.error(
                     `Hubo un error al guardar el producto ${product.error.message}`,
                     'Error',
                     5000
              );
              return;
            }
    
            this.notificacionService.success(
               'Producto agregado correctamente',
               'Completado!',
               3000
            );
            await this.router.navigateByUrl('/dashboard/ventas/products_services');  

        }else{
            const product = await firstValueFrom( 
              this.productoServicios.actualizarProductos(this.productosID(), formValue as Partial<ProductosInterface>)
            );

            if (product.success == false) {
                console.log(product.error);
                this.notificacionService.error(
                     `Hubo un error al guardar este item ${product.error.message}`,
                     'Error',
                     5000
                );
                return;
            }
      
            this.notificacionService.success(
               'Producto actualizado correctamente',
               'Completado!',
               3000
            );
            await this.router.navigateByUrl('/dashboard/ventas/products_services');   
    
        }

      } catch (error: any) {
          alert(error.message)
      }
    }
    
    async onCancel(){
      this.formProductos.reset();
      await this.router.navigateByUrl('/dashboard/ventas/products_services');   
    }

}
