import { Component, inject, signal } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CardsTotales, NumCardsTotalesComponent } from '@shared/components/num-cards-totales/num-cards-totales.component';
import { ClientesService } from '../services/clientes.service';
import { ModalComponents } from "@shared/components/modal.components/modal.components";
import { rxResource } from '@angular/core/rxjs-interop';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { firstValueFrom, tap } from 'rxjs';
import { modalOpen } from '@shared/interfaces/services.interfaces';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { NotificationService } from '@shared/services/notification.service';
import { TableClientsComponent } from './components/table-clients/table-clients.component';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HelpersUtils } from '@utils/helpers.utils';
import { ClientDetailComponent } from './components/client-detail/client-detail.component';
import { ClientesInterfaceResponse } from '@dashboard/interfaces/clientes-interface';

@Component({
    selector: 'app-clients-page',
    imports: [HeaderTitlePageComponent, TableClientsComponent, ModalComponents, LoaderComponent, PaginationComponent, RouterLink, ClientDetailComponent],
    templateUrl: './clients-page.component.html',
    standalone: true
})
export class ClientsPageComponent {

    headTitle: HeaderInput = {
        title: 'Gestión de Clientes',
        slog: 'Administra la información de tus clientes y sus fórmulas'
    }

    paginationService = inject(PaginationService);
    router = inject(Router);
    route = inject(ActivatedRoute);
    clienteServices = inject(ClientesService);
    notificacionService = inject(NotificationService);
    cardsTotales = signal<CardsTotales[]>([]);
    totalCliente = signal(0);
    idClienteToModal = signal<string>('');
    selectedCliente = signal<ClientesInterfaceResponse | null>(null);
    isModalEdit = false;
    isModalDetail = false;
    searchTerm = signal<string>(this.route.snapshot.queryParams['search'] || '');
    appliedSearchTerm = signal<string>(this.route.snapshot.queryParams['search'] || '');

    clientesResource = rxResource({
        request: () => ({ 
            page: this.paginationService.currentPage() - 1, 
            limit: 10,
            search: this.appliedSearchTerm()
        }),
        loader: ({ request }) => this.clienteServices.getClientes({ 
            offset: request.page * request.limit, 
            limit: request.limit,
            search: request.search 
        }).pipe(
            tap((el) => {
                this.totalCliente.set(el.count);
                this.paginationService.totalItems.set(el.count);
                this.cardsTotales.set([
                    { title: 'Total Clientes', valor: this.totalCliente().toString(), percent: '0' },
                    { title: 'Nuevos este Mes', valor: '0', percent: '0' },
                ]);
            })
        )
    });

    onSearch(term: string) {
        this.searchTerm.set(term);
    }

    executeSearch() {
        const term = this.searchTerm();
        this.appliedSearchTerm.set(term);
        this.router.navigate([], { queryParams: { search: term }, queryParamsHandling: 'merge' });
    }

    openModal(event: modalOpen) {
        this.isModalEdit = event.open;
        this.idClienteToModal.set(event.id);
    }

    onViewDetail(cliente: ClientesInterfaceResponse) {
        this.selectedCliente.set(cliente);
        this.isModalDetail = true;
    }

    async deleteCliente() {
        const ID = this.idClienteToModal();
        if (!ID) {
            this.notificacionService.error(
                `No se obtuvo el ID del cliente`,
                'Error',
                5000
            );
            return;
        }

        const client = await firstValueFrom(this.clienteServices.deleteCliente(ID));
        this.isModalEdit = false;
        if (client.success == false) {
            this.isModalEdit = false;
            this.notificacionService.error(
                `Hubo un error al guardar el cliente ${HelpersUtils.getMessageError(client.message)}`,
                'Error',
                5000
            );
            return;
        }

        this.notificacionService.success(
            'Cliente eliminado correctamente',
            'Completado!',
            3000
        );
        setTimeout(() => {
            window.location.reload();
        }, 600);
    }

}
