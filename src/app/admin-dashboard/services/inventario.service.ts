import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ResponseResult } from '@shared/interfaces/services.interfaces';
import type { NotificationService } from '@shared/services/notification.service';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from 'src/app/environments/environment';

const baseUrl = environment.baseUrl;

export interface AdvertenciaInventarioUI {
    codigo: string;
    mensaje: string;
}

/**
 * Política solo-alertar: muestra las advertencias de stock negativo que el
 * backend adjunta (`advertenciasInventario`) sin bloquear el flujo.
 * Llamar en los success de crear/emitir/registrar/anular.
 */
export function avisarAdvertenciasInventario(
    notificacion: Pick<NotificationService, 'warning'>,
    data: any,
): void {
    const advs = (data as any)?.advertenciasInventario;
    if (!Array.isArray(advs)) return;
    for (const a of advs as AdvertenciaInventarioUI[]) {
        notificacion.warning(a.mensaje || `Sin stock suficiente: ${a.codigo}`, 'Inventario', 8000);
    }
}

export interface MovimientoInventario {
    id: string;
    articuloId: string;
    tipo: 'entrada' | 'salida' | 'ajuste';
    cantidad: number;
    documentoTipo: string;
    documentoId: string;
    saldoDespues: number;
    motivo: string | null;
    createdAt: string;
}

export interface StockArticulo {
    articuloId: string;
    codigo: string;
    nombre: string;
    isInventariable: boolean;
    stock: number;
    ultimosMovimientos: MovimientoInventario[];
}

/** Kardex mínimo: stock, ajustes y saldos iniciales. */
@Injectable({ providedIn: 'root' })
export class InventarioService {
    private http = inject(HttpClient);

    getStock(articuloId: string): Observable<ResponseResult> {
        return this.http.get<{ success: boolean; data: StockArticulo }>(`${baseUrl}/inventario/stock/${articuloId}`).pipe(
            map((r): ResponseResult => ({ success: true, data: r.data })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error?.message }))
        );
    }

    ajuste(articuloId: string, cantidad: number, motivo?: string): Observable<ResponseResult> {
        return this.http.post(`${baseUrl}/inventario/ajuste`, { articuloId, cantidad, motivo }).pipe(
            map((r): ResponseResult => ({ success: true, data: r })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error?.message }))
        );
    }

    saldosIniciales(items: Array<{ articuloId: string; cantidad: number }>): Observable<ResponseResult> {
        return this.http.post(`${baseUrl}/inventario/saldos-iniciales`, { items }).pipe(
            map((r): ResponseResult => ({ success: true, data: r })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error?.message }))
        );
    }

    conciliacion(): Observable<ResponseResult> {
        return this.http.get(`${baseUrl}/inventario/conciliacion`).pipe(
            map((r): ResponseResult => ({ success: true, data: r })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error?.message }))
        );
    }
}
