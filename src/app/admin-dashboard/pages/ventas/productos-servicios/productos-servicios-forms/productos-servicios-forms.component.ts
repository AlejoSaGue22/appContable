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
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { HelpersUtils } from '@utils/helpers.utils';

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
  catalogsStore = inject(CatalogsStore);

  formProductos = this.fb.group({
    categoria: ['', Validators.required],
    nombre: ['', Validators.required],
    codigo: [''],
    unidadmedida: ['', Validators.required],
    impuesto: ['', Validators.required],
    isInventariable: [true],
    // retencion: ['', Validators.required],

    precioventa: this.fb.group({
      precio1: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      precio2: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]]
    }),
    observacion: ['']
  });

  constructor() {
    this.formProductos.get('categoria')?.valueChanges.subscribe((categoriaId) => {
      if (!categoriaId) return;
      const selectedCategory = this.categorias.find((c) => c.codigo === categoriaId);
      if (selectedCategory && selectedCategory.nombre.toLowerCase().includes('servicio')) {
        this.formProductos.get('isInventariable')?.setValue(false);
        this.formProductos.get('isInventariable')?.disable();
      } else {
        this.formProductos.get('isInventariable')?.enable();
      }
    });
  }

  productosID = toSignal(
    this.activateRoute.params.pipe(map((param) => param['id']))
  );
  categorias = inject(ProductosService).categorias().filter((c) => c.tipo == 'venta');

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
          this.formProductos.get('precioventa')?.setValue({
            precio1: p.precio,
            precio2: p.precioventa2
          });
          const isInv = p.isInventariable !== undefined ? p.isInventariable : (p.afectaInventario !== undefined ? p.afectaInventario : true);
          this.formProductos.get('isInventariable')?.setValue(isInv);
        })
      );
    }
  });

  async onSubmit() {
    const valid = this.formProductos.valid;
    this.formProductos.markAllAsTouched();
    console.log(this.formProductos.value)

    if (!valid) {
      this.notificacionService.error(
        `Formulario incompleto`,
        'Error',
        5000
      );
      return
    }

    const rawValue = this.formProductos.getRawValue();
    const { precioventa, ...restValue } = rawValue;
    const formValue = {
      ...restValue,
      precio: precioventa?.precio1,
      precioventa2: precioventa?.precio2
    };

    try {

      if (this.productosID() == 'new-Item') {
        const product = await firstValueFrom(this.productoServicios.agregarProducto(formValue as Partial<ArticulosInterface>));

        if (product.success == false) {
          this.notificacionService.error(
            `Hubo un error al guardar el producto ${HelpersUtils.getMessageError(product.message)}`,
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
          this.notificacionService.error(
            `Hubo un error al guardar este item ${HelpersUtils.getMessageError(product.message)}`,
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
      this.notificacionService.error(
        `Hubo un error al realizar la operacion ${HelpersUtils.getMessageError(error.message)}`,
        'Error',
        5000
      );
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
