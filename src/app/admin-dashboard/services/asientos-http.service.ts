import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
 
@Injectable({ providedIn: 'root' })
export class AsientosHttpService {
  private readonly base = `${environment.baseUrl}/asientos-contables`;
 
  constructor(private http: HttpClient) {}
 
  getByReferencia(referencia: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/por-referencia/${encodeURIComponent(referencia)}`);
  }
 
  reintentarAsientoFactura(facturaId: string): Observable<any> {
    return this.http.post(`${environment.baseUrl}/facturas-ventas/${facturaId}/reintentar-asiento`, {});
  }
 
  reintentarAsientoCompra(compraId: string): Observable<any> {
    return this.http.post(`${environment.baseUrl}/facturas-compras/${compraId}/reintentar-asiento`, {});
  }
}