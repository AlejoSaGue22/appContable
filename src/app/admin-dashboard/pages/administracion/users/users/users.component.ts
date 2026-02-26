import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap, firstValueFrom } from 'rxjs';

import { UsersService } from '../services/users.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { ErrorPages } from "@shared/components/error-pages/error-pages.component";
import { modalOpen } from '@shared/interfaces/services.interfaces';
import { ModalComponents } from '@shared/components/modal.components/modal.components';
import { Pagination } from '@shared/components/pagination/pagination';
import { HelpersUtils } from '@utils/helpers.utils';

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    RouterLink,
    LoaderComponent,
    ErrorPages,
    ModalComponents,
    Pagination
  ],
  templateUrl: './users.component.html',
  standalone: true
})
export class UsersComponent {
  usersService = inject(UsersService);
  paginationService = inject(PaginationService);
  notificationService = inject(NotificationService);

  searchTerm = signal<string>('');
  isModalVisible = false;
  userIdToDelete = signal<string>('');

  // Sincronizar búsqueda con delay (debounce)
  searchEffect = effect((onCleanup) => {
    const value = this.searchTerm();
    const timeout = setTimeout(() => {
      // La paginación se resetea vía URL si fuera necesario, 
      // pero por ahora solo disparamos la búsqueda
    }, 500);
    onCleanup(() => clearTimeout(timeout));
  });

  usersResource = rxResource({
    request: () => ({
      page: this.paginationService.currentPage() - 1,
      limit: 10,
      search: this.searchTerm()
    }),
    loader: ({ request }) => this.usersService.getUsers(request).pipe(
      tap((response) => {
        // Podríamos manejar totales aquí si fuera necesario
      })
    )
  });

  openDeleteModal(event: modalOpen) {
    this.isModalVisible = event.open;
    this.userIdToDelete.set(event.id);
  }

  async onDeleteUser() {
    const id = this.userIdToDelete();
    if (!id) return;

    const result = await firstValueFrom(this.usersService.deleteUser(id));
    this.isModalVisible = false;

    if (!result.success) {
        this.notificationService.error(
          `Error al eliminar usuario: ${HelpersUtils.getMessageError(result.message)}`,
          'Error',
          5000
        );
        return;
    }

    this.notificationService.success(
      'Usuario eliminado correctamente',
      'Completado',
      3000
    );

    // Recargar recurso
    this.usersResource.reload();
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }
}
