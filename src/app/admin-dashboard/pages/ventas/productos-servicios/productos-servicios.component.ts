import { Component, computed, inject, signal } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CardsTotales, NumCardsTotalesComponent } from '@shared/components/num-cards-totales/num-cards-totales.component';
import { TableListComponent } from "@shared/components/table-list/table-list.component";
import { ProductosService } from '../services/productos.service';


@Component({
  selector: 'app-productos-servicios',
  imports: [HeaderTitlePageComponent, TableListComponent, NumCardsTotalesComponent],
  templateUrl: './productos-servicios.component.html',
})
export class ProductosServiciosComponent {
    headTitleCliente: HeaderInput = {
        title: 'Productos y Servicios',
        slog: 'Administra la información de tus productos y servicios'
    }

    productService = inject(ProductosService);
    totalProductos = computed( () => this.productService._productos.length );


    cardValor : CardsTotales[] = [
         {
            title: 'Total Productos',
            valor: this.totalProductos().toString(),
            percent: '40'
         },
         {
            title: 'Nuevos este Mes',
            valor: '0',
            percent: '20'
         },
         {
            title: 'Total Servicios',
            valor: '0',
            percent: '20'
         }
   ]

    get columnsTable(){
      return [
         { key:'codigo', header: 'Codigo' },
         { key:'nombre', header: 'Nombre' },
         { key:'unidadmedida', header: 'Uni. Medida' },
         { key:'precioventa1', header: 'Precio' },
         { key:'impuesto', header: 'IVA' },
         { key:'retencion', header: 'Retencion' },
         { key:'categoria', header: 'Categoria' },
      ]
    }

 }
