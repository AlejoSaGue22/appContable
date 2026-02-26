import { ComprobanteVentaResponse, FacturaVenta } from './../../../interfaces/documento-venta-interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { catchError, delay, map, Observable, of } from 'rxjs';
import { environment } from 'src/app/environments/environment';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ComprobantesVentasService {

  private http = inject(HttpClient);

  getComprobanteVentas(options: Options & {
    status?: string;
    type?: string;
    clientName?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<ComprobanteVentaResponse> {
    const { limit = 10, page = 1, status, type, clientName, startDate, endDate } = options;

    // Build params object, only including defined values
    const params: any = {
      limit,
      page
    };

    if (status) params.status = status;
    if (type) params.type = type;
    if (clientName) params.clientName = clientName;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.http.get<ComprobanteVentaResponse>(`${baseUrl}/facturas-ventas`, {
      params
    }).pipe(
      delay(800)
    )
  }

  createInvoice(invoice: Partial<FacturaVenta>) {

    return this.http.post<ComprobanteVentaResponse>(`${baseUrl}/facturas-ventas`, invoice).pipe(
      map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );

  }


  getInvoiceById(id: string) {
    return this.http.get<ComprobanteVentaResponse>(`${baseUrl}/facturas-ventas/${id}`)
  }



}
