import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface Empresa {
  id: string;
  nit: string;
  razonSocial: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  configuracionDian?: any;
}

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly base = `${environment.baseUrl}/settings/empresa`;

  constructor(private http: HttpClient) {}

  getEmpresa(): Observable<ApiResponse<Empresa>> {
    return this.http.get<ApiResponse<Empresa>>(`${this.base}`);
  }

  updateEmpresa(dto: Partial<Empresa>): Observable<ApiResponse<Empresa>> {
    return this.http.put<ApiResponse<Empresa>>(`${this.base}`, dto);
  }
}
