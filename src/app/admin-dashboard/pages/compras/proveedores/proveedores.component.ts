import { Component, inject, signal } from '@angular/core';
import { HeaderInput } from "@dashboard/components/header-title-page/header-title-page.component";
import { CardsTotales } from "@shared/components/num-cards-totales/num-cards-totales.component";
import { NotificationService } from '@shared/services/notification.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap, of, firstValueFrom } from 'rxjs';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { ErrorPages } from "@shared/components/error-pages/error-pages.component";
import { HeaderTitleProveedoresComponent } from "./components/header-title-proveedores/header-title-proveedores.component";
import { TableProveedoresComponent } from "./components/table-proveedores/table-proveedores.component";
import { ProveedoresService } from '../services/proveedores.service';
import { modalOpen } from '@shared/interfaces/services.interfaces';
import { ModalComponents } from '@shared/components/modal.components/modal.components';
import { ProveedoresRequest } from '@dashboard/interfaces/proveedores-interface';

@Component({
   selector: 'app-proveedores',
   imports: [LoaderComponent, ErrorPages, HeaderTitleProveedoresComponent, TableProveedoresComponent, ModalComponents],
   templateUrl: './proveedores.component.html',
   standalone: true
})
export class ProveedoresComponent {

   headTitle: HeaderInput = {
      title: 'Gestión de Proveedores',
      slog: 'Administra la información de tus proveedores'
   }

   // Paginación
   currentPage = signal(1);
   totalPages = signal(1);
   totalItems = signal(0);
   pageSize = signal(10);

   isModalEdit = false;
   idProveedorToModal = signal<string>('');

   paginationService = inject(PaginationService);
   proveedoresService = inject(ProveedoresService);
   notificacionService = inject(NotificationService);
   totalProveedores = signal<number>(0);
   cardsTotales = signal<CardsTotales[]>([]);
   proveedoresList = signal<ProveedoresRequest[]>([]);

   // TODO: Reemplazar con el servicio real cuando esté disponible
   proveedoresResource = rxResource({
      request: () => ({ page: this.paginationService.currentPage() - 1, limit: 10 }),
      loader: ({ request }) => this.proveedoresService.getProveedores(request).pipe(
         tap((response) => {
            this.proveedoresList.set(response.proveedores); // TODO: Agregar el tipo de dato correcto
            this.totalProveedores.set(response.count ?? 0);

         })
      )
   })

   formatCurrency(value: number): string {
      return new Intl.NumberFormat('es-CO', {
         style: 'currency',
         currency: 'COP',
         minimumFractionDigits: 0
      }).format(value);
   }

   get columnsTable() {
      return [
         { key: 'fecha', header: 'Fecha Registro' },
         { key: 'identificacion', header: 'Identificación' },
         { key: 'nombre', header: 'Nombre/Razón Social' },
         { key: 'telefono', header: 'Teléfono' },
         { key: 'email', header: 'Email' },
         { key: 'estado', header: 'Estado' },
      ]
   }

   onSearch(searchTerm: string) {
      const proveedores = this.proveedoresList();
      if (searchTerm.length > 0) {
         const proveedoresFiltrados = proveedores.filter((proveedor) => proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
         this.proveedoresList.set(proveedoresFiltrados);
      } else {
         this.proveedoresList.set(proveedores);
      }
   }

   openModal(event: modalOpen) {
      this.isModalEdit = event.open;
      this.idProveedorToModal.set(event.id);
   }

   async onDelete() {
      const ID = this.idProveedorToModal();
      if (!ID) {
         this.notificacionService.error(
            `No se obtuvo el ID del proveedor`,
            'Error',
            5000
         );
         return;
      }

      const client = await firstValueFrom(this.proveedoresService.deleteProveedor(ID));
      this.isModalEdit = false;
      if (client.success == false) {
         this.isModalEdit = false;
         this.notificacionService.error(
            `Hubo un error al guardar el proveedor ${client.error.message}`,
            'Error',
            5000
         );
         return;
      }

      this.notificacionService.success(
         'Proveedor eliminado correctamente',
         'Completado!',
         3000
      );
      setTimeout(() => {
         window.location.reload();
      }, 600);
   }
}
