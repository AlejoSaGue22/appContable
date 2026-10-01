import { Component, inject, signal } from '@angular/core';
import { HeaderInput } from "@dashboard/components/header-title-page/header-title-page.component";
import { CardsTotales } from "@shared/components/num-cards-totales/num-cards-totales.component";

import { NotificationService } from '@shared/services/notification.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap, of, firstValueFrom } from 'rxjs';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { ErrorPages } from "@shared/components/error-pages/error-pages.component";
import { TableProveedoresComponent } from "./components/table-proveedores/table-proveedores.component";

import { ProveedoresService } from '../services/proveedores.service';
import { ModalComponent } from "@shared/components/modal/modal.component";

import { ProveedoresRequest } from '@dashboard/interfaces/proveedores-interface';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { HeaderTitleProveedoresComponent } from './components/header-title-proveedores/header-title-proveedores.component';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  imports: [LoaderComponent, RouterLink, ErrorPages, HeaderTitleProveedoresComponent, TableProveedoresComponent, ModalComponent,
    PaginationComponent, HeaderTitlePageComponent],
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

  isModalEdit = signal<boolean>(false);
  idProveedorToModal = signal<string>('');

  router = inject(Router);
  route = inject(ActivatedRoute);
  paginationService = inject(PaginationService);
  proveedoresService = inject(ProveedoresService);
  notificacionService = inject(NotificationService);
  totalProveedores = signal<number>(0);
  cardsTotales = signal<CardsTotales[]>([]);

  searchTerm = signal<string>(this.route.snapshot.queryParams['search'] || '');
  appliedSearchTerm = signal<string>(this.route.snapshot.queryParams['search'] || '');

  proveedoresResource = rxResource({
    request: () => ({
      page: this.paginationService.currentPage(),
      limit: 10,
      search: this.appliedSearchTerm()
    }),
    loader: ({ request }) => this.proveedoresService.getProveedores({
      offset: request.page,
      limit: request.limit,
      search: request.search
    }).pipe(
      tap((response) => {
        this.totalProveedores.set(response.count ?? 0);
        const size = Math.ceil((response.count ?? 0) / request.limit);
        this.paginationService.totalItems.set(response.count ?? 0);
        this.paginationService.pageSize.set(size);
      })
    )
  });

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

  onSearch(term: string) {
    // Solo actualiza el texto del input — NO dispara petición HTTP
    this.searchTerm.set(term);
  }

  executeSearch() {
    // Aplica la búsqueda y recarga el resource (resetea paginación a página 1)
    this.appliedSearchTerm.set(this.searchTerm());
    this.router.navigate([], {
      queryParams: { search: this.searchTerm() || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  clearSearch() {
    this.searchTerm.set('');
    this.appliedSearchTerm.set('');
    this.router.navigate([], { queryParams: { search: null, page: 1 }, queryParamsHandling: 'merge' });
  }

  openModal(event: any) {
    this.isModalEdit.set(event.open);
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
    this.isModalEdit.set(false);
    if (client.success == false) {
      this.isModalEdit.set(false);
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
      this.proveedoresResource.reload();
    }, 300);
  }
}
