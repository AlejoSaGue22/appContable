import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { catchError, delay, map, Observable, of } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { NotaAjusteCompraResponse, NotaAjusteCompraResponseById } from '../../../interfaces/notas-ajuste-compra-interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ComprasNotasAjusteService {

  private http = inject(HttpClient);

  getNotasAjuste(options: Options & {
    tipo?: string;
    estado?: string;
    facturaNumero?: string;
    proveedorNombre?: string;
  }): Observable<NotaAjusteCompraResponse> {
    const { limit = 10, page = 1, tipo, estado, facturaNumero, proveedorNombre } = options;

    const params: any = {
      limit,
      page
    };

    if (tipo) params.tipo = tipo;
    if (estado) params.estado = estado;
    if (facturaNumero) params.facturaNumero = facturaNumero;
    if (proveedorNombre) params.proveedorNombre = proveedorNombre;

    return this.http.get<NotaAjusteCompraResponse>(`${baseUrl}/notas-ajuste-compras`, {
      params
    }).pipe(
      delay(800)
    );
  }

  getNotaAjusteById(id: string): Observable<NotaAjusteCompraResponseById> {
    return this.http.get<NotaAjusteCompraResponseById>(`${baseUrl}/notas-ajuste-compras/${id}`);
  }

  createNotaCredito(data: any): Observable<ResponseResult> {
    return this.http.post<any>(`${baseUrl}/notas-ajuste-compras`, data).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  updateNotaAjuste(id: string, data: any): Observable<ResponseResult> {
    return this.http.patch<any>(`${baseUrl}/notas-ajuste-compras/${id}`, data).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  registrarBorrador(id: string): Observable<ResponseResult> {
    return this.http.patch<any>(`${baseUrl}/notas-ajuste-compras/${id}/registrar`, {}).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  removeNotaAjuste(id: string): Observable<ResponseResult> {
    return this.http.delete<any>(`${baseUrl}/notas-ajuste-compras/${id}`).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  anularNotaAjuste(id: string, motivo: string): Observable<ResponseResult> {
    return this.http.patch<any>(`${baseUrl}/notas-ajuste-compras/${id}/anular`, { motivo }).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  reintentarAsiento(id: string): Observable<ResponseResult> {
    return this.http.patch<any>(`${baseUrl}/notas-ajuste-compras/${id}/reintentar-asiento`, {}).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  getNotasByFacturaId(facturaId: string): Observable<NotaAjusteCompraResponse> {
    return this.http.get<NotaAjusteCompraResponse>(`${baseUrl}/notas-ajuste-compras/factura/${facturaId}`);
  }
}
