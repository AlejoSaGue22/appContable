import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { firstValueFrom, map, tap } from 'rxjs';
import { ProductosService } from '../../services/productos.service';
import { ArticulosInterface } from '@dashboard/interfaces/productos-interface';
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

  isModal = input<boolean>(false);
  saveSuccess = output<any>();
  cancel = output<void>();


  headTitle: HeaderInput = {
    title: 'Registra un servicio o producto',
    slog: 'Gestiona la información de servicios y productos'
  }

  private fb = inject(FormBuilder);
  private productoServicios = inject(ProductosService);
  private notificacionService = inject(NotificationService);
  private router = inject(Router);
  private activateRoute = inject(ActivatedRoute);

  formProductos = this.fb.group({
    categoria: ['', Validators.required],
    nombre: ['', Validators.required],
    codigo: [''],
    unidadmedida: ['', Validators.required],
    impuesto: [0, Validators.required],
    // retencion: ['', Validators.required],

    precioventa: this.fb.group({
      precio1: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      precio2: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]]
    }),
    observacion: ['']
  });

  productosID = toSignal(
    this.activateRoute.params.pipe(map((param) => param['id']))
  );
  categorias = inject(ProductosService).categorias.filter((c) => c.tipo == 'venta');

  productoIdRxResourse = rxResource({
    request: () => {
      // Solo cargar si NO está en modo modal
      if (this.isModal()) {
        return null;
      }
      return { id: this.productosID() };
    },
    loader: ({ request }) => {
      if (!request) {
        // Si no hay request (modo modal), retornar un observable vacío
        return this.productoServicios.getProductoByID('new-Item');
      }
      return this.productoServicios.getProductoByID(request.id).pipe(
        tap((p) => {
          this.formProductos.reset(p);
          this.formProductos.get('categoria')?.setValue(p.tipoCodigo!);
          this.formProductos.get('precioventa')?.setValue({
            precio1: p.precio,
            precio2: p.precioventa2
          })
        })
      );
    }
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
      impuesto: typeof this.formProductos.value.impuesto == 'string' ?
        parseInt(this.formProductos.value.impuesto) : this.formProductos.value.impuesto,
      precio: this.formProductos.value.precioventa?.precio1,
      precioventa2: this.formProductos.value.precioventa?.precio2
    };

    delete formValue.precioventa;

    try {

      if (this.productosID() == 'new-Item') {
        const product = await firstValueFrom(this.productoServicios.agregarProducto(formValue as Partial<ArticulosInterface>));

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

        if (this.isModal()) {
          this.saveSuccess.emit(product.data);
        } else {
          await this.router.navigateByUrl('/panel/ventas/products_services');
        }

      } else {
        const product = await firstValueFrom(
          this.productoServicios.actualizarProductos(this.productosID(), formValue as Partial<ArticulosInterface>)
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
        await this.router.navigateByUrl('/panel/ventas/products_services');

      }

    } catch (error: any) {
      alert(error.message)
    }
  }

  async onCancel() {
    this.formProductos.reset();
    if (this.isModal()) {
      this.cancel.emit();
    } else {
      await this.router.navigateByUrl('/panel/ventas/products_services');
    }
  }

}
