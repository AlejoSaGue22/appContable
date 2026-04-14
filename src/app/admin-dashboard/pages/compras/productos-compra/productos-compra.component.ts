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
import { HeaderTitleProductosCompraComponent } from "./components/header-title-productos-compra/header-title-productos-compra.component";
import { TableProductosCompra } from "./components/table-productos-compra/table-productos-compra/table-productos-compra.component";
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { HeaderTitlePageComponent, HeaderInput } from "@dashboard/components/header-title-page/header-title-page.component";
import { GetProductosDetalle } from '@dashboard/interfaces/productos-interface';

@Component({
   imports: [CommonModule, LoaderComponent, ModalComponents, HeaderTitleProductosCompraComponent, TableProductosCompra,
    PaginationComponent, HeaderTitlePageComponent],
   templateUrl: './productos-compra.component.html',
   standalone: true,
})
export class ProductosCompraComponent {

   paginationService = inject(PaginationService);
   productoServicio = inject(ProductosService);
   notificacionService = inject(NotificationService);
   totalProducto = signal<GetProductosDetalle[]>([]);
   idProductoToModal = signal<string>('');
   isModalEdit = false;

   headTitle: HeaderInput = {
      title: 'Productos y Servicios',
      slog: 'Administra la información de tus productos y servicios'
   }

   productorxResource = rxResource({
      request: () => ({ page: this.paginationService.currentPage() - 1, limit: 10 }),
      loader: ({ request }) => {
         return this.productoServicio.getProductos({ offset: request.page * request.limit, limit: request.limit, venta_compra: 'compra' }).pipe(
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
      
   }

}
