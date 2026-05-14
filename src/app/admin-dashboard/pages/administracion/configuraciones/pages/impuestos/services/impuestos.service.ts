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

  getAll(): Observable<Impuesto[]> {
    return this.http.get<Impuesto[]>(this.apiUrl);
  }

  getById(id: string): Observable<Impuesto> {
    return this.http.get<Impuesto>(`${this.apiUrl}/${id}`);
  }

  create(impuesto: Partial<Impuesto>): Observable<Impuesto> {
    return this.http.post<Impuesto>(this.apiUrl, impuesto);
  }

  update(id: string, impuesto: Partial<Impuesto>): Observable<Impuesto> {
    return this.http.patch<Impuesto>(`${this.apiUrl}/${id}`, impuesto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
