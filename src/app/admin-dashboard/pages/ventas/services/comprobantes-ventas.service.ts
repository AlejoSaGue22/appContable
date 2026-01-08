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

  getComprobanteVentas(options: Options): Observable<ComprobanteVentaResponse>{
        const { limit = 10, offset = 0 } = options;
  
        return this.http.get<ComprobanteVentaResponse>(`${baseUrl}/facturas-ventas`, {
            params: {
                limit,
                offset
            }
        }).pipe(
            delay(800)
        )
  }

  createInvoice(invoice: Partial<FacturaVenta>){

    return this.http.post<ComprobanteVentaResponse>(`${baseUrl}/facturas-ventas`, invoice).pipe(
            map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error}))
    );

  }


  getInvoiceById(id: string){
    return this.http.get<ComprobanteVentaResponse>(`${baseUrl}/facturas-ventas/${id}`)
      // .pipe(
      //       map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
      //       catchError((error: any): Observable<ResponseResult> => of({ success: false, error}))
      // );
  }



}
