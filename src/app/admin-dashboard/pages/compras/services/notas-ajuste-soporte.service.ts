import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { catchError, delay, map, Observable, of } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { NotaAjusteSoporteResponse, NotaAjusteSoporteResponseById } from '../../../interfaces/notas-ajuste-soporte-interface';

const baseUrl = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class NotasAjusteSoporteService {

  private http = inject(HttpClient);

  getNotasAjuste(options: Options & {
    tipo?: string;
    estado?: string;
    documentoNumero?: string;
    proveedorNombre?: string;
  }): Observable<NotaAjusteSoporteResponse> {
    const { limit = 10, page = 1, tipo, estado, documentoNumero, proveedorNombre } = options;

    const params: any = {
      limit,
      page
    };

    if (tipo) params.tipo = tipo;
    if (estado) params.estado = estado;
    if (documentoNumero) params.documentoNumero = documentoNumero;
    if (proveedorNombre) params.proveedorNombre = proveedorNombre;

    return this.http.get<NotaAjusteSoporteResponse>(`${baseUrl}/notas-ajuste-soporte`, {
      params
    }).pipe(
      delay(800)
    );
  }

  getNotaAjusteById(id: string): Observable<NotaAjusteSoporteResponseById> {
    return this.http.get<NotaAjusteSoporteResponseById>(`${baseUrl}/notas-ajuste-soporte/${id}`);
  }

  createNotaCredito(data: any): Observable<ResponseResult> {
    return this.http.post<any>(`${baseUrl}/notas-ajuste-soporte/credito`, data).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  createNotaDebito(data: any): Observable<ResponseResult> {
    return this.http.post<any>(`${baseUrl}/notas-ajuste-soporte/debito`, data).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  updateNotaAjuste(id: string, data: any): Observable<ResponseResult> {
    return this.http.patch<any>(`${baseUrl}/notas-ajuste-soporte/${id}`, data).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  registrarBorrador(id: string): Observable<ResponseResult> {
    return this.http.patch<any>(`${baseUrl}/notas-ajuste-soporte/${id}/registrar`, {}).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  removeNotaAjuste(id: string): Observable<ResponseResult> {
    return this.http.delete<any>(`${baseUrl}/notas-ajuste-soporte/${id}`).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  anularNotaAjuste(id: string, motivo: string): Observable<ResponseResult> {
    return this.http.patch<any>(`${baseUrl}/notas-ajuste-soporte/${id}/anular`, { motivo }).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  reintentarAsiento(id: string): Observable<ResponseResult> {
    return this.http.patch<any>(`${baseUrl}/notas-ajuste-soporte/${id}/reintentar-asiento`, {}).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  descargarPdf(id: string): Observable<Blob> {
    return this.http.get(`${baseUrl}/notas-ajuste-soporte/${id}/pdf`, { responseType: 'blob' });
  }
}
