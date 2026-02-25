import { Component, inject, signal } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CardsTotales, NumCardsTotalesComponent } from '@shared/components/num-cards-totales/num-cards-totales.component';
import { ProductosService } from '../services/productos.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { firstValueFrom, tap } from 'rxjs';
import { ModalComponents } from "@shared/components/modal.components/modal.components";
import { modalOpen } from '@shared/interfaces/services.interfaces';
import { NotificationService } from '@shared/services/notification.service';
import { TableProductosComponent } from './components/table-productos/table-productos.component';
import { Pagination as PaginationComponent } from '@shared/components/pagination/pagination';
import { Router, RouterLink } from '@angular/router';

@Component({
   selector: 'app-productos-servicios',
   imports: [HeaderTitlePageComponent, TableProductosComponent, LoaderComponent, ModalComponents, PaginationComponent, RouterLink],
   templateUrl: './productos-servicios.component.html',
   standalone: true
})
export class ProductosServiciosComponent {

   headTitleCliente: HeaderInput = {
      title: 'Productos y Servicios',
      slog: 'Administra la información de tus productos y servicios'
   }

   paginationService = inject(PaginationService);
   router = inject(Router);
   productoServicio = inject(ProductosService);
   notificacionService = inject(NotificationService);
   totalProducto = signal(0);
   idProductoToModal = signal<string>('');
   isModalEdit = false;
   cardValor = signal<CardsTotales[]>([])
   searchTerm = signal<string>('');

   productorxResource = rxResource({
      request: () => ({ 
          page: this.paginationService.currentPage() - 1, 
          limit: 10,
          search: this.searchTerm()
      }),
      loader: ({ request }) => {
         return this.productoServicio.getProductos({ 
             offset: request.page * request.limit, 
             limit: request.limit, 
             venta_compra: 'venta',
             search: request.search
         }).pipe(
            tap((p) => {
               this.totalProducto.set(p.count);
               this.cardValor.set([
                  { title: 'Total Productos', valor: this.totalProducto().toString(), percent: '100' },
                  { title: 'Nuevos este Mes', valor: '0', percent: '20' },
                  { title: 'Total Servicios', valor: '0', percent: '20' }
               ]);
            })
         )
      }
   })

   onSearch(term: string) {
       this.searchTerm.set(term);
       this.router.navigate([], { queryParams: { page: 1 }, queryParamsHandling: 'merge' });
   }

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

}
