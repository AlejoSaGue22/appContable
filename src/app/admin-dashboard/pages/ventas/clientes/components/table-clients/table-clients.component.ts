import { Component, input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ClientesInterfaceResponse } from '@dashboard/interfaces/clientes-interface';
import { modalOpen } from '@shared/interfaces/services.interfaces';

@Component({
    selector: 'app-table-clients',
    imports: [CommonModule, RouterLink],
    templateUrl: './table-clients.component.html',
    standalone: true
})
export class TableClientsComponent {

    clientesData = input<ClientesInterfaceResponse[]>([]);
    emptyTitle = input('No hay clientes registrados');
    emptyHint = input('Comienza agregando tu primer cliente');
    @Output() delete = new EventEmitter<modalOpen>();
    @Output() view = new EventEmitter<ClientesInterfaceResponse>();

    onDeleteCliente(id: string) {
        this.delete.emit({ open: true, id });
    }

    onViewCliente(cliente: ClientesInterfaceResponse) {
        this.view.emit(cliente);
    }
}
