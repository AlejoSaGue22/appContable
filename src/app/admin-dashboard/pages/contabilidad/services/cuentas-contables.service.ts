import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { GetCuentasContables } from '../interfaces/cuentas-contables.interface';

@Injectable({
  providedIn: 'root'
})
export class CuentasContablesService {
  private readonly base = `${environment.baseUrl}/cuentas`;

  constructor(private http: HttpClient) {}

  getCuentasContables(): Observable<GetCuentasContables[]> {
    return this.http.get<GetCuentasContables[]>(this.base);
  }
}
