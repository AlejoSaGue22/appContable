import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FacturaNotasResumenResponse } from '@dashboard/interfaces/documento-venta-interface';
import { DocumentoSoporte, DocumentoSoporteResponse } from '@dashboard/interfaces/documento-soporte-interface';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { environment } from 'src/app/environments/environment';
import { catchError, delay, map, Observable, of } from 'rxjs';

const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class DocumentosSoporteService {
  private http = inject(HttpClient);

  getDocumentosSoporte(options: Options & {
    estado?: string;
    tipo?: string;
    dianStatus?: string;
    providerName?: string;
    numeroFactura?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<DocumentoSoporteResponse> {
    const { limit = 10, page = 1, estado, tipo, dianStatus, providerName, numeroFactura, startDate, endDate } = options;

    const params: any = {
      limit,
      page
    };

    if (estado) params.estado = estado;
    if (tipo) params.tipo = tipo;
    if (dianStatus) params.dianStatus = dianStatus;
    if (providerName) params.providerName = providerName;
    if (numeroFactura) params.numeroFactura = numeroFactura;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.http.get<DocumentoSoporteResponse>(`${baseUrl}/documentos-soportes`, { params }).pipe(
      delay(800),
      map((response): DocumentoSoporteResponse => response)
    )
  }

  getDocumentoSoporteById(id: string): Observable<ResponseResult> {
    return this.http.get(`${baseUrl}/documentos-soportes/${id}`).pipe(
      map((response): ResponseResult => ({ success: true, data: response, message: 'Documento soporte obtenido correctamente' })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )
  }

  createDocumentoSoporte(documento: Partial<DocumentoSoporte>): Observable<ResponseResult> {
    return this.http.post<DocumentoSoporteResponse>(`${baseUrl}/documentos-soportes`, documento).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )
  }

  updateDocumentoSoporte(id: string, documento: Partial<DocumentoSoporte>): Observable<ResponseResult> {
    return this.http.patch<DocumentoSoporteResponse>(`${baseUrl}/documentos-soportes/${id}`, documento).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )
  }

  anularDocumentoSoporte(id: string): Observable<ResponseResult> {
    return this.http.patch<DocumentoSoporteResponse>(`${baseUrl}/documentos-soportes/${id}/anular`, {}).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )
  }

  deleteDocumentoSoporte(id: string): Observable<ResponseResult> {
    return this.http.delete<DocumentoSoporteResponse>(`${baseUrl}/documentos-soportes/${id}`).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )
  }

  registrarDocumentoSoporte(id: string): Observable<ResponseResult> {
    return this.http.patch<DocumentoSoporteResponse>(`${baseUrl}/documentos-soportes/${id}/registrar`, {}).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )
  }

  emitirDocumentoSoporte(id: string): Observable<ResponseResult> {
    return this.http.post<DocumentoSoporteResponse>(`${baseUrl}/documentos-soportes/${id}/emitir`, {}).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )
  }

  retryAsiento(id: string): Observable<ResponseResult> {
    return this.http.post<DocumentoSoporteResponse>(`${baseUrl}/documentos-soportes/${id}/reintentar-asiento`, {}).pipe(
      delay(800),
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )
  }

  descargarPdf(id: string): Observable<Blob> {
    return this.http.get(`${baseUrl}/documentos-soportes/${id}/pdf`, { responseType: 'blob' });
  }

  getAnticiposDisponibles(proveedorId: string): Observable<any> {
    return this.http.get<any>(`${baseUrl}/pagos/anticipos-disponibles/proveedor/${proveedorId}`);
  }

  getAplicacionesAnticipo(documentoId: string): Observable<any> {
    return this.http.get<any>(`${baseUrl}/pagos/aplicaciones/documento-soporte/${documentoId}`);
  }

  getNotasResumen(id: string): Observable<FacturaNotasResumenResponse> {
    return this.http.get<FacturaNotasResumenResponse>(`${baseUrl}/documentos-soportes/${id}/notas-resumen`);
  }
}
