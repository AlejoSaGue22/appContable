import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { firstValueFrom, tap } from 'rxjs';
import { ModalComponents } from "@shared/components/modal.components/modal.components";
import { modalOpen } from '@shared/interfaces/services.interfaces';
import { NotificationService } from '@shared/services/notification.service';
import { ProductosService } from '@dashboard/pages/ventas/services/productos.service';
import { TableProductosCompra } from "./components/table-productos-compra/table-productos-compra/table-productos-compra.component";
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { HeaderTitlePageComponent, HeaderInput } from "@dashboard/components/header-title-page/header-title-page.component";
import { GetProductosDetalle } from '@dashboard/interfaces/productos-interface';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

@Component({
 imports: [CommonModule, LoaderComponent, ModalComponents, RouterLink, TableProductosCompra,
 PaginationComponent, HeaderTitlePageComponent],
 templateUrl: './productos-compra.component.html',
 standalone: true,
})
export class ProductosCompraComponent {

 paginationService = inject(PaginationService);
 router = inject(Router);
 route = inject(ActivatedRoute);
 productoServicio = inject(ProductosService);
 notificacionService = inject(NotificationService);
 totalProducto = signal<GetProductosDetalle[]>([]);
 idProductoToModal = signal<string>('');
 isModalEdit = false;
 searchTerm = signal<string>(this.route.snapshot.queryParams['search'] || '');
 appliedSearchTerm = signal<string>(this.route.snapshot.queryParams['search'] || '');

 headTitle: HeaderInput = {
 title: 'Productos y Servicios',
 slog: 'Administra la información de tus productos y servicios'
 }

 productorxResource = rxResource({
 request: () => ({ page: this.paginationService.currentPage(), limit: 10, search: this.appliedSearchTerm() }),
 loader: ({ request }) => {
 return this.productoServicio.getProductos({ offset: this.paginationService.currentPage(), limit: request.limit, venta_compra: 'costo', search: request.search }).pipe(
 tap((p) => {
 this.totalProducto.set(p.articulos);
 const size = Math.ceil(p.count / request.limit);
 this.paginationService.totalItems.set(p.count);
 this.paginationService.pageSize.set(size);
 })
 )
 }
 })

 openModal(event: modalOpen) {
 this.isModalEdit = event.open;
 this.idProductoToModal.set(event.id);
 }

 async deleteProducto() {
 const ID = this.idProductoToModal();
 if (!ID) {
 this.notificacionService.error(
 'No se obtuvo el Producto o Servicio',
 'Error',
 5000
 );
 return;
 }

 const product = await firstValueFrom(this.productoServicio.deleteProducto(ID));
 this.isModalEdit = false;
 if (product.success == false) {
 this.isModalEdit = false;
 this.notificacionService.error(
 `Hubo un error al guardar el Producto o Servicio ${product.error.message}`,
 'Error',
 5000
 );
 return;
 }

 this.notificacionService.success(
 'Se ha eliminado el producto correctamente',
 'Eliminado!',
 3000
 );
 setTimeout(() => {
 window.location.reload();
 }, 600);
 }

 onSearch(searchTerm: string) {
 this.searchTerm.set(searchTerm);
 }

 executeSearch() {
 const term = this.searchTerm();
 this.appliedSearchTerm.set(term);
 this.router.navigate([], { queryParams: { search: term }, queryParamsHandling: 'merge' });
 }

}
