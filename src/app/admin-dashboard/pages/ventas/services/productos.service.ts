import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed, inject } from '@angular/core';
import { ArticulosInterface, ArticulosResponse } from '@dashboard/interfaces/productos-interface';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { catchError, delay, map, Observable, of } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { CatalogsStore } from '@dashboard/services/catalogs.store';

const baseUrl = environment.baseUrl;

const emptyProducto: ArticulosInterface = {
  id: '',
  categoria: '',
  nombre: '',
  codigo: '',
  unidadmedida: '',
  impuesto: 0,
  precio: '',
  precioventa2: '',
  observacion: '',
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private http = inject(HttpClient);
  private catalogsStore = inject(CatalogsStore);

  categorias = computed(() => this.catalogsStore.categoriesArticles());

  getProductos(options: Options): Observable<ArticulosResponse> {

    const { limit = 10, offset = 0, venta_compra = 'venta' } = options;

    return this.http.get<ArticulosResponse>(`${baseUrl}/articulos`, {
      params: {
        limit,
        offset,
        venta_compra
      }
    }).pipe(
      delay(800)
    )
  }

  getProductoByID(id: string): Observable<ArticulosInterface> {
    if (id == 'new-Item') {
      return of(emptyProducto)
    }

    return this.http.get<ArticulosInterface>(`${baseUrl}/articulos/${id}`).pipe(
      delay(500)
    )
  }

  actualizarProductos(id: string, producto: Partial<ArticulosInterface>) {

    return this.http.patch(`${baseUrl}/articulos/${id}`, producto).pipe(
      map((product): ResponseResult => ({ success: true, data: product })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    )

  }

  agregarProducto(producto: Partial<ArticulosInterface>): Observable<ResponseResult> {

    return this.http.post<ArticulosInterface>(`${baseUrl}/articulos`, producto).pipe(
      map((product): ResponseResult => ({ success: true, data: product })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

  deleteProducto(id: string) {

    return this.http.delete(`${baseUrl}/articulos/delete/${id}`).pipe(
      map((client): ResponseResult => ({ success: true, data: client })),
      catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
    );
  }

}
