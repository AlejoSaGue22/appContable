import { Component, inject, signal } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CardsTotales, NumCardsTotalesComponent } from '@shared/components/num-cards-totales/num-cards-totales.component';
import { TableListComponent } from "@shared/components/table-list/table-list.component";
import { ClientesService } from '../services/clientes.service';
import { FlowbiteService } from 'src/app/utils/services/flowbite.service';
import { ModalComponents } from "@shared/components/modal.components/modal.components";
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { firstValueFrom, map, tap } from 'rxjs';
import { modalOpen } from '@shared/interfaces/services.interfaces';
import { PaginationService } from '@shared/components/pagination/pagination.service';

@Component({
  selector: 'app-clients-page',
  imports: [HeaderTitlePageComponent, NumCardsTotalesComponent, TableListComponent, ModalComponents, LoaderComponent],
  templateUrl: './clients-page.component.html',
})
export class ClientsPageComponent {

    headTitle: HeaderInput = {
      title: 'Gestión de Clientes',
      slog: 'Administra la información de tus clientes y sus fórmulas'
    }

    paginationService = inject(PaginationService);
    flowbiteService = inject(FlowbiteService);
    clienteServices = inject(ClientesService);
    cardsTotales = signal<CardsTotales[]>([]);
    totalCliente = signal(0);
    idClienteToModal = signal<string>('');
    isModalEdit = false;

    clientesResource = rxResource({
         request: () => ({ page: this.paginationService.currentPage() - 1, limit: 10 }),
         loader: ({ request }) => this.clienteServices.getClientes({ offset: request.page * 9, limit: request.limit }).pipe(
            tap((el) => {
                  this.totalCliente.set(el.count);
                  this.cardsTotales.set([
                      { title: 'Total Clientes', valor: this.totalCliente().toString(), percent: '0' },
                      { title: 'Nuevos este Mes', valor: '0', percent: '0' },
                  ]);
            })
         )
    });

    

    openModal(event: modalOpen){
        this.isModalEdit = event.open;
        this.idClienteToModal.set(event.id);
    }

    get columnsTable(){
          return [
              { key:'ind', header: '#' },
              { key:'tipoPersona_nom', header: 'Tipo Persona' },
              { key:'fullName', header: 'Nombre' },
              { key:'tipoDocumento', header: 'Documento' },
              { key:'numeroDocumento', header: 'Numero' },
              { key:'estado', header: 'Estado' },
              { key:'email', header: 'Correo' },
              { key:'telefono', header: 'Telefono' },
              { key:'direccion', header: 'Direccion' },
          ];
    }

    async deleteCliente(){
        const ID = this.idClienteToModal();
        if (!ID) {
            alert("No se obtuvo el cliente");
            return;
        }
        const client = await firstValueFrom( this.clienteServices.deleteCliente(ID) );
        this.isModalEdit = false;
        if (client.success == false) {
            this.isModalEdit = false;
            alert(`Hubo un error al guardar el cliente ${client.error.message}`);
            return;
        } 

        alert("Eliminado exitosamente");
        setTimeout(() => {
            window.location.reload();
        }, 600);
    }


    

    

 }
