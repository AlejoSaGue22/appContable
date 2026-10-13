import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { Prescripcion, PrescripcionesResponse } from '../interfaces/prescripcion.interface';

@Injectable({ providedIn: 'root' })
export class PrescripcionesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/prescripciones`;

  list(params?: Record<string, string | number | undefined>): Observable<PrescripcionesResponse> {
    const cleanParams: Record<string, string | number> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
          cleanParams[key] = value;
        }
      }
    }
    return this.http.get<PrescripcionesResponse>(this.base, { params: cleanParams });
  }
  get(id: string): Observable<{ success: boolean; data: Prescripcion }> { return this.http.get<any>(`${this.base}/${id}`); }
  history(clienteId: string): Observable<{ success: boolean; data: Prescripcion[] }> { return this.http.get<any>(`${this.base}/history/${clienteId}`); }
  create(payload: Partial<Prescripcion>): Observable<any> { return this.http.post(this.base, payload); }
  update(id: string, payload: Partial<Prescripcion>): Observable<any> { return this.http.patch(`${this.base}/${id}`, payload); }
  cancel(id: string): Observable<any> { return this.http.delete(`${this.base}/${id}`); }
}
