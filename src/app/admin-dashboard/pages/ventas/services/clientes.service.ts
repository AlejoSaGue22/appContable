import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ClientesInterface, ClientesResponse } from '@dashboard/interfaces/clientes-interface';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { catchError, delay, map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/app/environments/environment';

const baseUrl = environment.baseUrl;

const emptyCliente: ClientesInterface = {
  apellido: '',
  ciudad: '',
  direccion: '',
  email: '',
  id: '',
  nombre: '',
  numeroDocumento: '',
  observacion: '',
  razonSocial: '',
  responsableFiscal: '',
  telefono: '',
  tipoDocumento: '',
  tipoPersona: '',
}

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private http = inject(HttpClient);
  clienteRegistrados = signal<ClientesInterface[]>([]);
  private clientCache = new Map<string, ClientesResponse>();

  getClientes(options: Options): Observable<ClientesResponse> {
    const { limit = 10, offset = 0 } = options;

    const key = `${limit}-${offset}`;

    // if (this.clientCache.has(key)) {
    //   return of(this.clientCache.get(key)!)
    // }

    return this.http.get<ClientesResponse>(`${baseUrl}/clientes`, {
      params: {
        limit,
        offset
      }
    }).pipe(
      delay(100),
      //  tap((client) => this.clientCache.set(key, client))
    )

  }


  getClientesById(id: string): Observable<ClientesInterface> {

    if (id == 'new-Item') {
      return of(emptyCliente);
    }

    return this.http.get<ClientesInterface>(`${baseUrl}/clientes/${id}`).pipe(
      delay(300)
    )

  }

  actualizarClientes(id: string, cliente: Partial<ClientesInterface>) {

    const clienteUpdate = cliente as ClientesInterface;

    return this.http.patch(`${baseUrl}/clientes/${id}`, clienteUpdate).pipe(
      map((client): ResponseResult => ({ success: true, data: client })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error }))
    )
  }

  agregarCliente(cliente: Partial<ClientesInterface>): Observable<ResponseResult> {

    return this.http.post<ClientesInterface>(`${baseUrl}/clientes`, cliente).pipe(
      map((client): ResponseResult => ({ success: true, data: client })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error }))
    )
  }

  deleteCliente(id: string) {

    return this.http.delete(`${baseUrl}/clientes/delete/${id}`).pipe(
      map((client): ResponseResult => ({ success: true, data: client })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error }))
    )

  }

}
