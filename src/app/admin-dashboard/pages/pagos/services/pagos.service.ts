// src/app/pagos/services/pagos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/app/environments/environment';
import {
    AgingReporte, CuentaBancaria, CxcResponse, CxpResponse, HistorialPagosResponse, PagoHistorial,
    PagoResponseDto, PaymentStatus, RegistrarCobroDto, RegistrarPagoDto, ResumenCartera, CxFiltros,
    PagoHistorialResponse, ReporteAgingFlat,
    ReporteAgingFlatAgrupado,
    MovimientosResponse,
    MovimientosFiltros,
    AsientoPagoResponse,
    ResumenFinancieroResponse,
    EstadoCuentaClienteResponse,
    EstadoCuentaProveedorResponse
} from '@dashboard/interfaces/pagos-interface';


@Injectable({ providedIn: 'root' })
export class PagosHttpService {
    private readonly base = `${environment.baseUrl}`;

    constructor(private http: HttpClient) { }

    // ── Resumen (dashboard) ────────────────────────────────────────────────
    getResumenCartera(): Observable<ResumenCartera> {
        return this.http
            .get<ResumenCartera>(`${this.base}/reportes/cartera/resumen`)
            .pipe(map(r => r));
    }

    // ── CxC ───────────────────────────────────────────────────────────────
    getCxc(filtros: CxFiltros): Observable<CxcResponse> {
        let params = new HttpParams();
        if (filtros?.clienteId) params = params.set('clienteId', filtros.clienteId);
        if (filtros?.paymentStatus) params = params.set('paymentStatus', filtros.paymentStatus);
        if (filtros?.soloVencidas) params = params.set('soloVencidas', 'true');
        params = params.set('page', filtros.page.toString());
        params = params.set('limit', filtros.limit.toString());
        return this.http
            .get<PagoResponseDto<CxcResponse>>(`${this.base}/pagos/cxc`, { params })
            .pipe(map(r => r.data));
    }

    getHistorialCobros(facturaVentaId: string): Observable<PagoHistorial[]> {
        return this.http
            .get<PagoResponseDto<PagoHistorial[]>>(`${this.base}/pagos/cxc/${facturaVentaId}/historial`)
            .pipe(map(r => r.data));
    }

    registrarCobro(facturaVentaId: string, dto: RegistrarCobroDto): Observable<PagoResponseDto<unknown>> {
        return this.http.post<PagoResponseDto<unknown>>(`${this.base}/pagos/cxc/${facturaVentaId}/cobro`, dto);
    }

    // ── CxP ───────────────────────────────────────────────────────────────
    getCxp(filtros: CxFiltros): Observable<CxpResponse> {
        let params = new HttpParams();
        if (filtros?.proveedorId) params = params.set('proveedorId', filtros.proveedorId);
        if (filtros?.paymentStatus) params = params.set('paymentStatus', filtros.paymentStatus);
        if (filtros?.soloVencidas) params = params.set('soloVencidas', 'true');
        params = params.set('page', filtros.page.toString());
        params = params.set('limit', filtros.limit.toString());
        return this.http
            .get<PagoResponseDto<CxpResponse>>(`${this.base}/pagos/cxp`, { params })
            .pipe(map(r => r.data));
    }

    getHistorialPagos(facturaCompraId: string): Observable<PagoHistorialResponse> {
        return this.http
            .get<PagoHistorialResponse>(`${this.base}/pagos/cxp/${facturaCompraId}/historial`);
    }

    registrarPago(facturaCompraId: string, dto: RegistrarPagoDto): Observable<PagoResponseDto<unknown>> {
        return this.http.post<PagoResponseDto<unknown>>(`${this.base}/pagos/cxp/${facturaCompraId}/pago`, dto);
    }

    // ── Aging ─────────────────────────────────────────────────────────────
    getAgingCobrar(fechaInicio?: string, fechaFin?: string): Observable<AgingReporte> {
        let params = new HttpParams();
        if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
        if (fechaFin) params = params.set('fechaFin', fechaFin);

        return this.http
            .get<AgingReporte>(`${this.base}/reportes/cartera/aging-cobrar`, { params });
    }

    getAgingPagar(fechaInicio?: string, fechaFin?: string): Observable<AgingReporte> {
        let params = new HttpParams();
        if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
        if (fechaFin) params = params.set('fechaFin', fechaFin);

        return this.http
            .get<AgingReporte>(`${this.base}/reportes/cartera/aging-pagar`, { params });
    }
    // ── Aging (Reportes con filtros) ─────────────────────────────────────
    getReporteAgingCobrar(fechaInicio: string, fechaFin: string, page: number = 1, limit: number = 10): Observable<ReporteAgingFlatAgrupado> {
        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin)
            .set('page', page.toString())
            .set('limit', limit.toString());
        return this.http
            .get<ReporteAgingFlatAgrupado>(`${this.base}/reportes/cartera/reporte-aging-cobrar`, { params });
    }

    getReporteAgingPagar(fechaInicio: string, fechaFin: string, page: number = 1, limit: number = 10): Observable<ReporteAgingFlatAgrupado> {
        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin)
            .set('page', page.toString())
            .set('limit', limit.toString());
        return this.http
            .get<ReporteAgingFlatAgrupado>(`${this.base}/reportes/cartera/reporte-aging-pagar`, { params });
    }

    // ── Historial global ──────────────────────────────────────────────────
    getHistorialGlobal(fechaInicio: string, fechaFin: string, page: number = 1, limit: number = 10): Observable<HistorialPagosResponse> {
        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin)
            .set('page', page.toString())
            .set('limit', limit.toString());
        return this.http
            .get<HistorialPagosResponse>(
                `${this.base}/reportes/cartera/historial-pagos`,
                { params },
            )
            .pipe(map(r => r));
    }

    // ── Cuentas bancarias ─────────────────────────────────────────────────
    getCuentasBancarias(): Observable<CuentaBancaria[]> {
        return this.http
            .get<PagoResponseDto<CuentaBancaria[]>>(`${this.base}/pagos/cuentas-bancarias`)
            .pipe(map(r => r.data));
    }

    // ── Movimientos (listado global de cobros y pagos) ────────────────────
    getMovimientos(filtros: MovimientosFiltros): Observable<MovimientosResponse> {
        let params = new HttpParams();
        if (filtros.tipo) params = params.set('tipo', filtros.tipo);
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
        if (filtros.medioPago) params = params.set('medioPago', filtros.medioPago);
        if (filtros.clienteId) params = params.set('clienteId', filtros.clienteId);
        if (filtros.proveedorId) params = params.set('proveedorId', filtros.proveedorId);
        if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
        params = params.set('page', (filtros.page ?? 1).toString());
        params = params.set('limit', (filtros.limit ?? 20).toString());
        return this.http
            .get<PagoResponseDto<MovimientosResponse>>(`${this.base}/pagos/movimientos`, { params })
            .pipe(map(r => r.data));
    }

    // ── Asiento contable de un pago ───────────────────────────────────────
    getAsientoDePago(pagoId: string): Observable<AsientoPagoResponse> {
        return this.http
            .get<PagoResponseDto<AsientoPagoResponse>>(`${this.base}/pagos/${pagoId}/asiento`)
            .pipe(map(r => r.data));
    }

    // ── Resumen Financiero (Dashboard unificado) ─────────────────────────
    getResumenFinanciero(): Observable<ResumenFinancieroResponse> {
        return this.http
            .get<PagoResponseDto<ResumenFinancieroResponse>>(`${this.base}/pagos/resumen`)
            .pipe(map(r => r.data));
    }

    // ── Estado de Cuenta por Cliente ─────────────────────────────────────
    getEstadoCuentaCliente(clienteId: string): Observable<EstadoCuentaClienteResponse> {
        return this.http
            .get<PagoResponseDto<EstadoCuentaClienteResponse>>(`${this.base}/pagos/estado-cuenta/cliente/${clienteId}`)
            .pipe(map(r => r.data));
    }

    getEstadoCuentaClientePorDocumento(documento: string): Observable<EstadoCuentaClienteResponse> {
        const params = new HttpParams().set('documento', documento);
        return this.http
            .get<PagoResponseDto<EstadoCuentaClienteResponse>>(`${this.base}/pagos/estado-cuenta/cliente-por-documento`, { params })
            .pipe(map(r => r.data));
    }

    // ── Estado de Cuenta por Proveedor ───────────────────────────────────
    getEstadoCuentaProveedor(proveedorId: string): Observable<EstadoCuentaProveedorResponse> {
        return this.http
            .get<PagoResponseDto<EstadoCuentaProveedorResponse>>(`${this.base}/pagos/estado-cuenta/proveedor/${proveedorId}`)
            .pipe(map(r => r.data));
    }

    getEstadoCuentaProveedorPorDocumento(documento: string): Observable<EstadoCuentaProveedorResponse> {
        const params = new HttpParams().set('documento', documento);
        return this.http
            .get<PagoResponseDto<EstadoCuentaProveedorResponse>>(`${this.base}/pagos/estado-cuenta/proveedor-por-documento`, { params })
            .pipe(map(r => r.data));
    }
}