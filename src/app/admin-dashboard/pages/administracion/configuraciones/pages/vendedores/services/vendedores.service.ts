import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { Vendedor } from '../interfaces/vendedor.interface';

@Injectable({
 providedIn: 'root'
})
export class VendedoresService {
 private http = inject(HttpClient);
 private apiUrl = `${environment.baseUrl}/settings/vendedores`;

 getAll(page: number = 1, limit: number = 10, search?: string): Observable<{ data: Vendedor[], meta: any }> {
 const params: any = { page, limit };
 if (search) params.search = search;
 return this.http.get<{ data: Vendedor[], meta: any }>(this.apiUrl, { params });
 }

 getById(id: string): Observable<Vendedor> {
 return this.http.get<Vendedor>(`${this.apiUrl}/${id}`);
 }

 create(vendedor: Partial<Vendedor>): Observable<{ success: boolean, data: Vendedor, message: string }> {
 return this.http.post<{ success: boolean, data: Vendedor, message: string }>(this.apiUrl, vendedor);
 }

 update(id: string, vendedor: Partial<Vendedor>): Observable<{ success: boolean, data: Vendedor, message: string }> {
 return this.http.patch<{ success: boolean, data: Vendedor, message: string }>(`${this.apiUrl}/${id}`, vendedor);
 }

 delete(id: string): Observable<{ success: boolean, message: string }> {
 return this.http.delete<{ success: boolean, message: string }>(`${this.apiUrl}/${id}`);
 }
}
