import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/app/environments/environment';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { catchError, map, Observable, of } from 'rxjs';
import { ProveedoresInterface, ProveedoresResponse } from '@dashboard/interfaces/proveedores-interface';

const baseUrl = environment.baseUrl;

const emptyProveedor: ProveedoresInterface = {
    id: '',
    tipoDocumento: '',
    identificacion: '',
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    nombreContacto: '',
    telefonoContacto: '',
    observaciones: '',
    isActive: false
}

@Injectable({ providedIn: 'root' })
export class ProveedoresService {

    private http = inject(HttpClient);

    getProveedores(options: Options): Observable<ProveedoresResponse> {
        const { limit = 10, offset = 0 } = options;

        return this.http.get<ProveedoresResponse>(`${baseUrl}/proveedores`, {
            params: {
                limit,
                offset
            }
        });
    }

    getProveedoresById(id: string): Observable<ProveedoresInterface> {
        if (id == 'new-Item') {
            return of(emptyProveedor);
        }
        return this.http.get<ProveedoresInterface>(`${baseUrl}/proveedores/${id}`);
    }

    deleteProveedores(id: string) {
        return this.http.delete(`${baseUrl}/proveedores/${id}`);
    }

    createProveedor(proveedor: Partial<ProveedoresInterface>) {
        return this.http.post(`${baseUrl}/proveedores`, proveedor).pipe(
            map((proveedor): ResponseResult => ({ success: true, data: proveedor })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        );
    }

    updateProveedor(id: string, proveedor: Partial<ProveedoresInterface>) {
        return this.http.put(`${baseUrl}/proveedores/${id}`, proveedor).pipe(
            map((proveedor): ResponseResult => ({ success: true, data: proveedor })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        );
    }

    deleteProveedor(id: string) {
        return this.http.delete(`${baseUrl}/proveedores/${id}`).pipe(
            map((proveedor): ResponseResult => ({ success: true, data: proveedor })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        );
    }
}