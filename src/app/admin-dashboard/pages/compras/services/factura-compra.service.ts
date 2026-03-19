import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ComprobanteCompraResponse, FacturaCompra } from '@dashboard/interfaces/factura-compra-interface';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { environment } from 'src/app/environments/environment';
import { catchError, delay, map, Observable, of } from 'rxjs';

const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class FacturaCompraService {
    private http = inject(HttpClient);

    getFacturasCompras(options: Options & {
        estado?: string;
        type?: string;
        providerName?: string;
        startDate?: string;
        endDate?: string;
    }): Observable<ComprobanteCompraResponse> {
        const { limit = 10, page = 1, estado, type, providerName, startDate, endDate } = options;

        const params: any = {
            limit,
            page
        };

        if (estado) params.estado = estado;
        if (type) params.type = type;
        if (providerName) params.providerName = providerName;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        return this.http.get<ComprobanteCompraResponse>(`${baseUrl}/facturas-compras`, { params }).pipe(
            delay(800),
            map((response): ComprobanteCompraResponse => response)
        )
    }

    getFacturaCompraById(id: string): Observable<ResponseResult> {
        return this.http.get(`${baseUrl}/facturas-compras/${id}`).pipe(
            map((response): ResponseResult => ({ success: true, data: response, message: 'Factura de compra obtenida correctamente' })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        )
    }

    createFacturaCompra(factura: Partial<FacturaCompra>): Observable<ResponseResult> {
        return this.http.post<ComprobanteCompraResponse>(`${baseUrl}/facturas-compras`, factura).pipe(
            map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        )
    }

    updateFacturaCompra(id: string, factura: Partial<FacturaCompra>): Observable<ResponseResult> {
        return this.http.patch<ComprobanteCompraResponse>(`${baseUrl}/facturas-compras/${id}`, factura).pipe(
            map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        )
    }

    anularFacturaCompra(id: string): Observable<ResponseResult> {
        return this.http.patch<ComprobanteCompraResponse>(`${baseUrl}/facturas-compras/${id}/anular`, {}).pipe(
            map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        )   
    }

    deleteFacturaCompra(id: string): Observable<ResponseResult> {
        return this.http.delete<ComprobanteCompraResponse>(`${baseUrl}/facturas-compras/${id}`).pipe(
            map((response): ResponseResult => ({ success: true, data: response.data, message: response.message })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        )
    }

}