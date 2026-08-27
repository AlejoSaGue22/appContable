import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
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
  logoUrl?: string;
  configuracionDian?: any;
}

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly base = `${environment.baseUrl}/settings/empresa`;
  private empresaCache$?: Observable<ApiResponse<Empresa>>;

  constructor(private http: HttpClient) {}

  getEmpresa(): Observable<ApiResponse<Empresa>> {
    if (!this.empresaCache$) {
      this.empresaCache$ = this.http.get<ApiResponse<Empresa>>(`${this.base}`).pipe(
        shareReplay(1)
      );
    }
    return this.empresaCache$;
  }

  updateEmpresa(dto: Partial<Empresa>): Observable<ApiResponse<Empresa>> {
    this.empresaCache$ = undefined; // clear cache on update
    return this.http.put<ApiResponse<Empresa>>(`${this.base}`, dto);
  }

  uploadLogo(file: File): Observable<{ success: boolean; logoUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; logoUrl: string; message: string }>(`${this.base}/upload-logo`, formData);
  }
}
