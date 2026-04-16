import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { GetCuentasContables } from '../interfaces/cuentas-contables.interface';

@Injectable({
  providedIn: 'root'
})
export class CuentasContablesService {
  private readonly base = `${environment.baseUrl}/cuentas`;

  constructor(private http: HttpClient) {}

  getCuentasContables(params?: { search?: string, tipo?: string, fechaInicio?: string, fechaFin?: string }): Observable<GetCuentasContables[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.tipo) httpParams = httpParams.set('tipo', params.tipo);
    if (params?.fechaInicio) httpParams = httpParams.set('fechaInicio', params.fechaInicio);
    if (params?.fechaFin) httpParams = httpParams.set('fechaFin', params.fechaFin);

    return this.http.get<GetCuentasContables[]>(this.base, { params: httpParams });
  }
}
