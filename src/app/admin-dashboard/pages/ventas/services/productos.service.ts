import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed, inject } from '@angular/core';
import { ProductosInterface, ProductosResponse } from '@dashboard/interfaces/productos-interface';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { catchError, delay, map, Observable, of } from 'rxjs';
import { environment } from 'src/app/environments/environment';

const baseUrl = environment.baseUrl;

const emptyProducto: ProductosInterface = {
      id: '',
      categoria: '',
      nombre: '',
      codigo: '',
      unidadmedida: '',
      impuesto: '',
      retencion: '',
      precioventa1: '',
      precioventa2: '',
      observacion: '',
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private http = inject(HttpClient);

  getProductos(options: Options): Observable<ProductosResponse>{
  
        const { limit = 10, offset = 0 } = options;
  
        return this.http.get<ProductosResponse>(`${baseUrl}/productos`, {
            params: {
                limit,
                offset
            }
        }).pipe(
           delay(800)
        )
  }

  getProductoByID(id: string): Observable<ProductosInterface>{
      if (id == 'new-Item') {
         return of(emptyProducto)
      }

      return this.http.get<ProductosInterface>(`${baseUrl}/productos/${id}`).pipe(
        delay(500)
      )
  }

  actualizarProductos(id: string, producto: Partial<ProductosInterface>){

    return this.http.patch(`${baseUrl}/productos/${id}`, producto).pipe(
      map((product): ResponseResult => ({ success: true, data: product })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error}))
    )
    
  }

  agregarProducto(producto: Partial<ProductosInterface>): Observable<ResponseResult>{
  
      return this.http.post<ProductosInterface>(`${baseUrl}/productos`, producto).pipe(
        map((product): ResponseResult => ({ success: true, data: product })),
        catchError((error: any): Observable<ResponseResult> => of({ success: false, error}))
      );
  }

  deleteProducto(id: string){
  
      return this.http.delete(`${baseUrl}/productos/delete/${id}`).pipe(
            map((client): ResponseResult => ({ success: true, data: client })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error}))
      );
  }

}
