import { Component, inject, signal } from '@angular/core';
import { TableListComponent } from "@shared/components/table-list/table-list.component";
import { rxResource } from '@angular/core/rxjs-interop';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { firstValueFrom, tap } from 'rxjs';
import { ModalComponents } from "@shared/components/modal.components/modal.components";
import { modalOpen } from '@shared/interfaces/services.interfaces';
import { NotificationService } from '@shared/services/notification.service';
import { HeaderTitleComprasComponent } from '../factura-compra/components/header-title-compras/header-title-compras.component';
import { ProductosService } from '@dashboard/pages/ventas/services/productos.service';

@Component({
  selector: 'app-productos-compra',
  imports: [HeaderTitleComprasComponent, TableListComponent, LoaderComponent, ModalComponents],
  templateUrl: './productos-compra.component.html',
})
export class ProductosCompraComponent {

    paginationService = inject(PaginationService);
    productoServicio = inject(ProductosService);
    notificacionService = inject(NotificationService);
    totalProducto = signal(0);
    idProductoToModal = signal<string>('');
    isModalEdit = false;

    productorxResource = rxResource({
         request: () => ({ page: this.paginationService.currentPage() - 1, limit: 10 }),
         loader: ({ request }) => {
            return this.productoServicio.getProductos({ offset: request.page * 9, limit: request.limit }).pipe(
               tap((p) => {
                  this.totalProducto.set(p.count);
               })
            )
         }
    })


   openModal(event: modalOpen){
         this.isModalEdit = event.open;
         this.idProductoToModal.set(event.id);
   }

   get columnsTable(){
      return [
         { key:'codigo', header: 'Codigo' },
         { key:'nombre', header: 'Nombre' },
         { key:'categoria', header: 'Categoria' },
         { key:'precioventa1', header: 'Precio', type: 'number'},
         { key:'iva_percent', header: 'Impuestos' },
         { key:'rete_percent', header: 'Retencion' },
         { key:'unidadmedida', header: 'Medida' },
      ]
   }

   async deleteProducto(){
            const ID = this.idProductoToModal();
            if (!ID) {
                  this.notificacionService.error(
                     'No se obtuvo el Producto o Servicio',
                     'Error',
                     5000
                  );
                return;
            }

            const product = await firstValueFrom( this.productoServicio.deleteProducto(ID) );
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
