import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';

export interface ParametrizacionContable {
  id?: string;
  cuentaCobrarClientesId?: string;
  cuentaDevolucionesClientesId?: string;
  cuentaPagarProveedoresId?: string;
  cuentaDevolucionesProveedoresId?: string;
  cuentaDevolucionIvaComprasId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParametrizacionContableService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}/settings/parametrizacion-contable`;

  getConfiguracion(): Observable<ParametrizacionContable> {
    return this.http.get<ParametrizacionContable>(this.apiUrl);
  }

  updateConfiguracion(parametrizacion: Partial<ParametrizacionContable>): Observable<ParametrizacionContable> {
    return this.http.put<ParametrizacionContable>(this.apiUrl, parametrizacion);
  }
}
