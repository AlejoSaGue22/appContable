import { ComprobanteVentaResponse } from './../../../interfaces/documento-venta-interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Options } from '@shared/interfaces/services.interfaces';
import { delay, Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ComprobantesVentasService {

  private http = inject(HttpClient);

  getComprobanteVentas(options: Options): Observable<ComprobanteVentaResponse>{
          const { limit = 10, offset = 0 } = options;
    
          return this.http.get<ComprobanteVentaResponse>(`${baseUrl}/productos`, {
              params: {
                  limit,
                  offset
              }
          }).pipe(
             delay(800)
          )
  }

}
