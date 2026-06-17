import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { firstValueFrom, map, of, tap } from 'rxjs';
import { ArticulosInterface } from '@dashboard/interfaces/productos-interface';
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { NotificationService } from '@shared/services/notification.service';
import { ProductosService } from '@dashboard/pages/ventas/services/productos.service';
import { CatalogsStore } from '@dashboard/services/catalogs.store';

@Component({
 selector: 'app-productos-compra-forms',
 imports: [HeaderTitlePageComponent, ReactiveFormsModule, FormErrorLabelComponent, LoaderComponent],
 templateUrl: './productos-compra-forms.component.html',
})
export class ProductosCompraFormsComponent implements OnInit {

 headTitle: HeaderInput = {
 title: 'Registra un articulo de compra',
 slog: 'Gestiona la información de tus articulos de compra'
 }

 private fb = inject(FormBuilder);
 productoServicios = inject(ProductosService);
 notificacionService = inject(NotificationService);
 router = inject(Router);
 activateRoute = inject(ActivatedRoute);
 catalogsStore = inject(CatalogsStore);

 isModal = input<boolean>(false);
 saveSuccess = output<any>();
 cancel = output<void>();
 
 categorias = inject(ProductosService).categorias().filter((c) => c.tipo == 'costo' || c.tipo == 'gasto');

 formProductos = this.fb.group({
 categoria: ['', Validators.required],
 nombre: ['', Validators.required],
 codigo: [''],
 unidadmedida: ['', Validators.required],
 impuesto: ['', Validators.required],
 isInventariable: [true],
 // retencion: ['', Validators.required],
 precio_referencial: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
 observacion: ['']
 })

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

 ngOnInit(): void {
 if (this.isModal()) {
 this.formProductos.reset();
 }
 }

 productosID = toSignal(
 this.activateRoute.params.pipe(map((param) => param['id']))
 );

 productoIdRxResourse = rxResource({
 request: () => {
 if (this.isModal()) return null;
 return { id: this.productosID() };
 },
 loader: ({ request }) => {
 if (!request) {
 this.formProductos.reset();
 return of(null);
 }
 return this.productoServicios.getProductoByID(request.id).pipe(
 tap((p) => {
 this.formProductos.reset(p);
 this.formProductos.get('precio_referencial')?.setValue(p.precio);
 const isInv = p.isInventariable !== undefined ? p.isInventariable : (p.afectaInventario !== undefined ? p.afectaInventario : true);
 this.formProductos.get('isInventariable')?.setValue(isInv);
 })
 )
 }
 });

 async onSubmit() {
 const valid = this.formProductos.valid;
 this.formProductos.markAllAsTouched();
 console.log(this.formProductos.value)

 if (!valid) {
 this.notificacionService.error(`Formulario incompleto`,'Error', 5000);
 return
 }

 const rawValue = this.formProductos.getRawValue();
 const { precio_referencial, ...restValue } = rawValue;
 const formValue = {
 ...restValue,
 precio: precio_referencial,
 };
 try {

 if (this.productosID() == 'new-Item' || this.isModal()) {
 const product = await firstValueFrom(this.productoServicios.agregarProducto(formValue as Partial<ArticulosInterface>));

 if (product.success == false) {
 this.notificacionService.error(
 `Hubo un error al guardar el producto ${product.message}`,
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
 await this.router.navigateByUrl('/panel/compras/articles');
 }

 } else {
 const product = await firstValueFrom(
 this.productoServicios.actualizarProductos(this.productosID(), formValue as Partial<ArticulosInterface>)
 );

 if (product.success == false) {
 this.notificacionService.error(
 `Hubo un error al guardar este item ${product.message}`,
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
 await this.router.navigateByUrl('/panel/compras/articles');

 }

 } catch (error: any) {
 alert(error.message)
 }
 }

 async onCancel() {
 if (this.isModal()) {
 this.cancel.emit();
 } else {
 this.formProductos.reset();
 await this.router.navigateByUrl('/panel/compras/articles');
 }
 }

}
