import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { ActivoFijo, DepreciacionActivoFijo } from '../interfaces/activos-fijos.interface';

@Injectable({
  providedIn: 'root'
})
export class ActivosFijosService {
  private readonly base = `${environment.baseUrl}/activos-fijos`;

  constructor(private http: HttpClient) {}

  getActivosFijos(): Observable<ActivoFijo[]> {
    return this.http.get<ActivoFijo[]>(this.base);
  }

  getActivoFijo(id: string): Observable<ActivoFijo> {
    return this.http.get<ActivoFijo>(`${this.base}/${id}`);
  }

  create(activo: any): Observable<ActivoFijo> {
    return this.http.post<ActivoFijo>(this.base, activo);
  }

  update(id: string, activo: any): Observable<ActivoFijo> {
    return this.http.patch<ActivoFijo>(`${this.base}/${id}`, activo);
  }

  getDepreciaciones(activoId: string): Observable<DepreciacionActivoFijo[]> {
    return this.http.get<DepreciacionActivoFijo[]>(`${this.base}/${activoId}/depreciaciones`);
  }

  depreciarPeriodo(dto: { anio: number; mes: number }): Observable<{ procesados: number }> {
    return this.http.post<{ procesados: number }>(`${this.base}/depreciar`, dto);
  }

  retirarActivo(id: string, dto: {
    fecha: string;
    motivo: string;
    valorVenta: number;
    cuentaIngresoRetiroId?: string;
    cuentaPerdidaRetiroId?: string;
    cuentaBancoCajaId?: string;
  }): Observable<ActivoFijo> {
    return this.http.post<ActivoFijo>(`${this.base}/${id}/retirar`, dto);
  }
}
