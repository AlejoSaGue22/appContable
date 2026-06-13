import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import {
    Empleado, CreateEmpleadoDto, UpdateEmpleadoDto,
    PeriodoNomina, CreatePeriodoDto, Liquidacion, PagoNomina,
    EntidadSeguridadSocial, Cargo, CentroCosto,
    PaginatedResponse
} from '../interfaces/nomina.interface';

@Injectable({ providedIn: 'root' })
export class NominaService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.baseUrl}/nomina`;

    // ── Empleados ───────────────────────────────────────────────────
    getEmpleados(params?: any): Observable<PaginatedResponse<Empleado>> {
        let httpParams = new HttpParams();
        if (params?.limit) httpParams = httpParams.set('limit', params.limit);
        if (params?.offset) httpParams = httpParams.set('offset', params.offset);
        if (params?.search) httpParams = httpParams.set('search', params.search);
        return this.http.get<PaginatedResponse<Empleado>>(`${this.base}/empleados`, { params: httpParams });
    }

    getEmpleado(id: string): Observable<Empleado> {
        return this.http.get<Empleado>(`${this.base}/empleados/${id}`);
    }

    createEmpleado(dto: CreateEmpleadoDto): Observable<Empleado> {
        return this.http.post<Empleado>(`${this.base}/empleados`, dto);
    }

    updateEmpleado(id: string, dto: UpdateEmpleadoDto): Observable<Empleado> {
        return this.http.patch<Empleado>(`${this.base}/empleados/${id}`, dto);
    }

    deleteEmpleado(id: string): Observable<any> {
        return this.http.delete(`${this.base}/empleados/${id}`);
    }

    // ── Períodos ────────────────────────────────────────────────────
    getPeriodos(params?: any): Observable<PaginatedResponse<PeriodoNomina>> {
        let httpParams = new HttpParams();
        if (params?.limit) httpParams = httpParams.set('limit', params.limit);
        if (params?.offset) httpParams = httpParams.set('offset', params.offset);
        return this.http.get<PaginatedResponse<PeriodoNomina>>(`${this.base}/periodos`, { params: httpParams });
    }

    getPeriodo(id: string): Observable<PeriodoNomina> {
        return this.http.get<PeriodoNomina>(`${this.base}/periodos/${id}`);
    }

    createPeriodo(dto: CreatePeriodoDto): Observable<PeriodoNomina> {
        return this.http.post<PeriodoNomina>(`${this.base}/periodos`, dto);
    }

    liquidarPeriodo(id: string, dto: any): Observable<any> {
        return this.http.post(`${this.base}/periodos/${id}/liquidar`, dto);
    }

    getLiquidaciones(periodoId: string): Observable<Liquidacion[]> {
        return this.http.get<Liquidacion[]>(`${this.base}/periodos/${periodoId}/liquidaciones`);
    }

    getPagos(params?: any): Observable<PaginatedResponse<PagoNomina>> {
        let httpParams = new HttpParams();
        if (params?.limit) httpParams = httpParams.set('limit', params.limit);
        if (params?.offset) httpParams = httpParams.set('offset', params.offset);
        return this.http.get<PaginatedResponse<PagoNomina>>(`${this.base}/pagos`, { params: httpParams });
    }

    getPagosByPeriodo(periodoId: string): Observable<PagoNomina[]> {
        return this.http.get<PagoNomina[]>(`${this.base}/pagos/periodo/${periodoId}`);
    }

    enviarDian(id: string): Observable<any> {
        return this.http.post(`${this.base}/periodos/${id}/enviar-dian`, {});
    }

    descargarXmlDian(id: string): Observable<Blob> {
        return this.http.get(`${this.base}/periodos/${id}/descargar-xml`, { responseType: 'blob' });
    }

    pagarNomina(id: string, dto: { fechaPago: string; cuentaCodigoContable: string; bancoId?: string; numeroComprobante?: string; observaciones?: string }): Observable<any> {
        return this.http.post(`${this.base}/periodos/${id}/pagar`, dto);
    }

    anularNomina(id: string): Observable<any> {
        return this.http.post(`${this.base}/periodos/${id}/anular`, {});
    }

    // ── Catálogos ───────────────────────────────────────────────────
    getEntidadesSeguridad(tipo?: string): Observable<EntidadSeguridadSocial[]> {
        let params = new HttpParams();
        if (tipo) params = params.set('tipo', tipo);
        return this.http.get<EntidadSeguridadSocial[]>(`${this.base}/entidades-seguridad`, { params });
    }

    getCargos(): Observable<Cargo[]> {
        return this.http.get<Cargo[]>(`${this.base}/cargos`);
    }

    getCentrosCosto(): Observable<CentroCosto[]> {
        return this.http.get<CentroCosto[]>(`${this.base}/centros-costo`);
    }

    getTiposContrato(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/tipos-contrato`);
    }

    // ── Reportes ────────────────────────────────────────────────────
    getReporteCostosCentroCosto(fechaInicio?: string, fechaFin?: string): Observable<any> {
        let params = new HttpParams();
        if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
        if (fechaFin) params = params.set('fechaFin', fechaFin);
        return this.http.get(`${this.base}/reportes/costos-centro-costo`, { params });
    }

    getReporteCostosCargo(fechaInicio?: string, fechaFin?: string): Observable<any> {
        let params = new HttpParams();
        if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
        if (fechaFin) params = params.set('fechaFin', fechaFin);
        return this.http.get(`${this.base}/reportes/costos-cargo`, { params });
    }

    getReporteComparativo(periodo1Id: string, periodo2Id: string): Observable<any> {
        return this.http.get(`${this.base}/reportes/comparativo`, {
            params: new HttpParams().set('periodo1Id', periodo1Id).set('periodo2Id', periodo2Id),
        });
    }

    getReporteResumenAportes(periodoId: string): Observable<any> {
        return this.http.get(`${this.base}/reportes/resumen-aportes/${periodoId}`);
    }
}
