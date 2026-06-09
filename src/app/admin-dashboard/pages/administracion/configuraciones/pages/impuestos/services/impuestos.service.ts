import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { Impuesto } from '../interfaces/impuesto.interface';

@Injectable({
  providedIn: 'root'
})
export class ImpuestosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}/settings/impuestos`;

  getAll(page: number = 1, limit: number = 10, search?: string): Observable<{ data: Impuesto[], meta: any }> {
    const params: any = { page, limit };
    if (search) params.search = search;
    return this.http.get<{ data: Impuesto[], meta: any }>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Impuesto> {
    return this.http.get<Impuesto>(`${this.apiUrl}/${id}`);
  }

  create(impuesto: Partial<Impuesto>): Observable<{ success: boolean, data: Impuesto, message: string }> {
    return this.http.post<{ success: boolean, data: Impuesto, message: string }>(this.apiUrl, impuesto);
  }

  update(id: string, impuesto: Partial<Impuesto>): Observable<{ success: boolean, data: Impuesto, message: string }> {
    return this.http.patch<{ success: boolean, data: Impuesto, message: string }>(`${this.apiUrl}/${id}`, impuesto);
  }

  delete(id: string): Observable<{ success: boolean, message: string }> {
    return this.http.delete<{ success: boolean, message: string }>(`${this.apiUrl}/${id}`);
  }
}
