import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { catchError, delay, map, Observable, of } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { NotaAjuste, NotaAjusteResponse } from '../../../interfaces/notas-ajuste-interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class NotasAjusteService {

  private http = inject(HttpClient);

  getNotasAjuste(options: Options & {
    tipo?: string;
    estado?: string;
    facturaNumero?: string;
    clienteNombre?: string;
  }): Observable<NotaAjusteResponse> {
    const { limit = 10, page = 1, tipo, estado, facturaNumero, clienteNombre } = options;

    const params: any = {
      limit,
      page
    };

    if (tipo) params.tipo = tipo;
    if (estado) params.estado = estado;
    if (facturaNumero) params.facturaNumero = facturaNumero;
    if (clienteNombre) params.clienteNombre = clienteNombre;

    return this.http.get<NotaAjusteResponse>(`${baseUrl}/notas-ajuste`, {
      params
    }).pipe(
      delay(800)
    );
  }

  getNotaAjusteById(id: string): Observable<NotaAjusteResponse> {
    return this.http.get<NotaAjusteResponse>(`${baseUrl}/notas-ajuste/${id}`);
  }

  createNotaCredito(data: any): Observable<ResponseResult> {
    return this.http.post<NotaAjusteResponse>(`${baseUrl}/notas-ajuste/credito`, data).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  createNotaDebito(data: any): Observable<ResponseResult> {
    return this.http.post<NotaAjusteResponse>(`${baseUrl}/notas-ajuste/debito`, data).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  updateNotaAjuste(id: string, data: any): Observable<ResponseResult> {
    return this.http.patch<NotaAjusteResponse>(`${baseUrl}/notas-ajuste/${id}`, data).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  emitirNotaAjuste(id: string): Observable<ResponseResult> {
    return this.http.patch<NotaAjusteResponse>(`${baseUrl}/notas-ajuste/${id}/emitir`, {}).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  anularNotaAjuste(id: string, motivo: string): Observable<ResponseResult> {
    return this.http.patch<NotaAjusteResponse>(`${baseUrl}/notas-ajuste/${id}/anular`, { motivo }).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  getNotasByFacturaId(facturaId: string): Observable<NotaAjusteResponse> {
    return this.http.get<NotaAjusteResponse>(`${baseUrl}/notas-ajuste/factura/${facturaId}`);
  }

  downloadPDF(id: string): Observable<Blob> {
    return this.http.get(`${baseUrl}/notas-ajuste/${id}/pdf`, { responseType: 'blob' });
  }

  downloadXML(id: string): Observable<Blob> {
    return this.http.get(`${baseUrl}/notas-ajuste/${id}/xml`, { responseType: 'blob' });
  }

}
