import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientesInterfaceResponse } from '@dashboard/interfaces/clientes-interface';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-detail.component.html',
})
export class ClientDetailComponent {
  cliente = input.required<ClientesInterfaceResponse>();
}
