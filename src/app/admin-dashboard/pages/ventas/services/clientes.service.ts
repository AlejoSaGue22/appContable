import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ClientesFormInterface, ClientesInterfaceResponse, ClientesResponse } from '@dashboard/interfaces/clientes-interface';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { catchError, delay, map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { Municipality } from '@dashboard/interfaces/catalogs-interface';

const baseUrl = environment.baseUrl;

const emptyCliente: ClientesFormInterface = {
  apellido: '',
  ciudad: '',
  direccion: '',
  email: '',
  id: '',
  nombre: '',
  numeroDocumento: '',
  observacion: '',
  razonSocial: '',
  isActive: true,
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
  clienteRegistrados = signal<ClientesInterfaceResponse[]>([]);
  private clientCache = new Map<string, ClientesResponse>();
  private municipalitiesCache: Municipality[] | null = null;

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


  getClientesById(id: string): Observable<ClientesFormInterface> {

    if (id == 'new-Item') {
      return of(emptyCliente);
    }

    return this.http.get<ClientesFormInterface>(`${baseUrl}/clientes/${id}`).pipe(
      delay(300)
    )

  }

  actualizarClientes(id: string, cliente: Partial<ClientesFormInterface>) {

    const clienteUpdate = cliente as ClientesFormInterface;

    return this.http.patch(`${baseUrl}/clientes/${id}`, clienteUpdate).pipe(
      map((client): ResponseResult => ({ success: true, data: client })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )
  }

  agregarCliente(cliente: Partial<ClientesFormInterface>): Observable<ResponseResult> {

    return this.http.post<ClientesInterfaceResponse>(`${baseUrl}/clientes`, cliente).pipe(
      map((client): ResponseResult => ({ success: true, data: client })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )
  }

  deleteCliente(id: string) {

    return this.http.delete(`${baseUrl}/clientes/delete/${id}`).pipe(
      map((client): ResponseResult => ({ success: true, data: client })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )

  }

  getMunicipalities(): Observable<Municipality[]> {
    if (this.municipalitiesCache) {
      return of(this.municipalitiesCache);
    }

    return this.http.get<Municipality[]>(`${baseUrl}/municipalities`).pipe(
      tap(municipalities => this.municipalitiesCache = municipalities),
      catchError(error => {
        console.error('Error fetching municipalities', error);
        return of([]);
      })
    );
  }

}
