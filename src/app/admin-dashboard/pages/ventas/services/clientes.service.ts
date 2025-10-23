import { Injectable, signal } from '@angular/core';
import { ClientesInterface } from '@dashboard/interfaces/clientes-interface';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  clienteRegistrados = signal<ClientesInterface[]>([]);

  get _clientes(): ClientesInterface[] {
    return  this.clienteRegistrados().map(cliente => {
              return {
                ...cliente,
                razonSocial: cliente.razonSocial || cliente.nombre + ' ' + cliente.apellido
              };
            });
  }

  actualizarClientes(cliente: Partial<ClientesInterface>){

    const clienteUpdate = cliente as ClientesInterface;

    const clientesActualizados = this.clienteRegistrados().map(c => {
      if(c.numeroDocumento === clienteUpdate.numeroDocumento){
        return {
          ...c,
          ...clienteUpdate
        }
      }
      return c;
    });

    this.clienteRegistrados.set(clientesActualizados);
  }

  agregarCliente(cliente: Partial<ClientesInterface>){

    if (this.clienteRegistrados().length === 0) {
      this.clienteRegistrados.set([cliente as ClientesInterface]);
      return;
    }

    this.clienteRegistrados.update(clientes => [
      ...clientes,
      cliente as ClientesInterface
    ]);
  }

}
