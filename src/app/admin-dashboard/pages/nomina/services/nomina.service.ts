import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/app/environments/environment';
import {
  Empleado, CreateEmpleadoDto, UpdateEmpleadoDto,
  PeriodoNomina, CreatePeriodoDto, Liquidacion, PagoNomina,
  EntidadSeguridadSocial, Cargo, CentroCosto,
  PaginatedResponse, ConceptoNomina, EmpleadoConceptoRecurrente, CreateEmpleadoConceptoDto, PeriodoEmpleado, ParametroNominaVersion,
  PeriodoEmpleadoConcepto, ConceptosConsolidadosResponse, ObligacionNomina, PagarObligacionesDto
} from '../interfaces/nomina.interface';


@Injectable({ providedIn: 'root' })
export class NominaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/nomina`;

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Ocurrió un error inesperado';
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return throwError(() => new Error(errorMessage));
  };


  // ── Empleados ───────────────────────────────────────────────────
  getEmpleados(params?: any): Observable<PaginatedResponse<Empleado>> {
    let httpParams = new HttpParams();
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.offset) httpParams = httpParams.set('offset', params.offset);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.activo !== undefined && params?.activo !== '') httpParams = httpParams.set('activo', params.activo);
    if (params?.cargoId) httpParams = httpParams.set('cargoId', params.cargoId);
    return this.http.get<PaginatedResponse<Empleado>>(`${this.base}/empleados`, { params: httpParams }).pipe(catchError(this.handleError));
  }

  getEmpleado(id: string): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.base}/empleados/${id}`).pipe(catchError(this.handleError));
  }

  createEmpleado(dto: CreateEmpleadoDto): Observable<Empleado> {
    return this.http.post<Empleado>(`${this.base}/empleados`, dto).pipe(catchError(this.handleError));
  }

  updateEmpleado(id: string, dto: UpdateEmpleadoDto): Observable<Empleado> {
    return this.http.patch<Empleado>(`${this.base}/empleados/${id}`, dto).pipe(catchError(this.handleError));
  }

  deleteEmpleado(id: string): Observable<any> {
    return this.http.delete(`${this.base}/empleados/${id}`).pipe(catchError(this.handleError));
  }

  // ── Períodos ────────────────────────────────────────────────────
  getPeriodos(params?: any): Observable<PaginatedResponse<PeriodoNomina>> {
    let httpParams = new HttpParams();
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.offset) httpParams = httpParams.set('offset', params.offset);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);
    if (params?.tipo) httpParams = httpParams.set('tipo', params.tipo);
    if (params?.fecha) httpParams = httpParams.set('fecha', params.fecha);
    if (params?.anio) httpParams = httpParams.set('anio', params.anio);
    return this.http.get<PaginatedResponse<PeriodoNomina>>(`${this.base}/periodos`, { params: httpParams }).pipe(catchError(this.handleError));
  }

  getPeriodo(id: string): Observable<PeriodoNomina> {
    return this.http.get<PeriodoNomina>(`${this.base}/periodos/${id}`).pipe(catchError(this.handleError));
  }

  createPeriodo(dto: CreatePeriodoDto): Observable<PeriodoNomina> {
    return this.http.post<PeriodoNomina>(`${this.base}/periodos`, dto).pipe(catchError(this.handleError));
  }

  deletePeriodo(id: string): Observable<any> {
    return this.http.delete(`${this.base}/periodos/${id}`).pipe(catchError(this.handleError));
  }

  liquidarPeriodo(id: string, dto: any): Observable<any> {
    return this.http.post(`${this.base}/periodos/${id}/liquidar`, dto).pipe(catchError(this.handleError));
  }

  getJobStatus(id: string): Observable<any> {
    return this.http.get(`${this.base}/periodos/${id}/estado-trabajo`).pipe(catchError(this.handleError));
  }

  getLiquidaciones(periodoId: string): Observable<Liquidacion[]> {
    return this.http.get<Liquidacion[]>(`${this.base}/periodos/${periodoId}/liquidaciones`).pipe(catchError(this.handleError));
  }

  getPagos(params?: any): Observable<PaginatedResponse<PagoNomina>> {
    let httpParams = new HttpParams();
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.offset) httpParams = httpParams.set('offset', params.offset);
    return this.http.get<PaginatedResponse<PagoNomina>>(`${this.base}/pagos`, { params: httpParams }).pipe(catchError(this.handleError));
  }

  getObligaciones(params?: any): Observable<ObligacionNomina[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<ObligacionNomina[]>(`${this.base}/obligaciones`, { params: httpParams }).pipe(catchError(this.handleError));
  }

  pagarObligaciones(periodoId: string, dto: PagarObligacionesDto): Observable<any> {
    return this.http.post<any>(`${this.base}/periodos/${periodoId}/pagar`, dto).pipe(catchError(this.handleError));
  }

  getPagosByPeriodo(periodoId: string): Observable<PagoNomina[]> {
    return this.http.get<PagoNomina[]>(`${this.base}/pagos/periodo/${periodoId}`).pipe(catchError(this.handleError));
  }

  enviarDian(id: string): Observable<any> {
    return this.http.post(`${this.base}/periodos/${id}/enviar-dian`, {}).pipe(catchError(this.handleError));
  }

  descargarXmlDian(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/periodos/${id}/descargar-xml`, { responseType: 'blob' }).pipe(catchError(this.handleError));
  }

  pagarNomina(id: string, dto: { fechaPago: string; cuentaCodigoContable: string; bancoId?: string; numeroComprobante?: string; observaciones?: string }): Observable<any> {
    return this.http.post(`${this.base}/periodos/${id}/pagar`, dto).pipe(catchError(this.handleError));
  }

  anularNomina(id: string): Observable<any> {
    return this.http.post(`${this.base}/periodos/${id}/anular`, {}).pipe(catchError(this.handleError));
  }

  reversarLiquidacion(id: string): Observable<any> {
    return this.http.post(`${this.base}/periodos/${id}/reversar`, {}).pipe(catchError(this.handleError));
  }

  // ── Catálogos ───────────────────────────────────────────────────
  getEntidadesSeguridad(tipo?: string): Observable<EntidadSeguridadSocial[]> {
    let params = new HttpParams();
    if (tipo) params = params.set('tipo', tipo);
    return this.http.get<EntidadSeguridadSocial[]>(`${this.base}/entidades-seguridad`, { params }).pipe(catchError(this.handleError));
  }

  getCargos(): Observable<Cargo[]> {
    return this.http.get<Cargo[]>(`${this.base}/cargos`).pipe(catchError(this.handleError));
  }

  getCentrosCosto(): Observable<CentroCosto[]> {
    return this.http.get<CentroCosto[]>(`${this.base}/centros-costo`).pipe(catchError(this.handleError));
  }

  getTiposContrato(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/tipos-contrato`).pipe(catchError(this.handleError));
  }

  getBancos(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.baseUrl}/bancos`).pipe(catchError(this.handleError));
  }

  // ── Conceptos y Recurrentes ───────────────────────────────────────
  getConceptos(): Observable<ConceptoNomina[]> {
    return this.http.get<ConceptoNomina[]>(`${this.base}/conceptos`).pipe(catchError(this.handleError));
  }

  getConceptosRecurrentesByEmpleado(empleadoId: string): Observable<EmpleadoConceptoRecurrente[]> {
    return this.http.get<EmpleadoConceptoRecurrente[]>(`${this.base}/empleados/${empleadoId}/conceptos-recurrentes`).pipe(catchError(this.handleError));
  }

  createEmpleadoConcepto(empleadoId: string, dto: CreateEmpleadoConceptoDto): Observable<EmpleadoConceptoRecurrente> {
    return this.http.post<EmpleadoConceptoRecurrente>(`${this.base}/empleados/${empleadoId}/conceptos-recurrentes`, dto).pipe(catchError(this.handleError));
  }

  updateEmpleadoConcepto(id: string, dto: Partial<CreateEmpleadoConceptoDto>): Observable<EmpleadoConceptoRecurrente> {
    return this.http.patch<EmpleadoConceptoRecurrente>(`${this.base}/empleados/conceptos-recurrentes/${id}`, dto).pipe(catchError(this.handleError));
  }

  toggleEmpleadoConcepto(id: string): Observable<EmpleadoConceptoRecurrente> {
    return this.http.patch<EmpleadoConceptoRecurrente>(`${this.base}/empleados/conceptos-recurrentes/${id}/toggle`, {}).pipe(catchError(this.handleError));
  }

  deleteEmpleadoConcepto(id: string): Observable<any> {
    return this.http.delete(`${this.base}/empleados/conceptos-recurrentes/${id}`).pipe(catchError(this.handleError));
  }

  // ── Empleados por Período ───────────────────────────────────────
  getEmpleadosOfPeriodo(periodoId: string): Observable<PeriodoEmpleado[]> {
    return this.http.get<PeriodoEmpleado[]>(`${this.base}/periodos/${periodoId}/empleados`).pipe(catchError(this.handleError));
  }

  assignEmpleadosToPeriodo(periodoId: string, empleadoIds: string[], diasNovedad: number = 30): Observable<PeriodoEmpleado[]> {
    return this.http.post<PeriodoEmpleado[]>(`${this.base}/periodos/${periodoId}/empleados`, { empleadoIds, diasNovedad }).pipe(catchError(this.handleError));
  }

  removeEmpleadoFromPeriodo(periodoId: string, empleadoId: string): Observable<any> {
    return this.http.delete(`${this.base}/periodos/${periodoId}/empleados/${empleadoId}`).pipe(catchError(this.handleError));
  }

  getConceptosConsolidadosPeriodoEmpleado(periodoId: string, empleadoId: string): Observable<ConceptosConsolidadosResponse> {
    return this.http.get<ConceptosConsolidadosResponse>(`${this.base}/periodos/${periodoId}/empleados/${empleadoId}/conceptos`).pipe(catchError(this.handleError));
  }

  addConceptoOcasionalPeriodo(periodoId: string, empleadoId: string, dto: { conceptoId: string; valor: number; tipoValor?: string; observacion?: string }): Observable<PeriodoEmpleadoConcepto> {
    return this.http.post<PeriodoEmpleadoConcepto>(`${this.base}/periodos/${periodoId}/empleados/${empleadoId}/conceptos`, dto).pipe(catchError(this.handleError));
  }

  removeConceptoOcasionalPeriodo(id: string): Observable<any> {
    return this.http.delete(`${this.base}/periodos/empleados/conceptos/${id}`).pipe(catchError(this.handleError));
  }

  // ── Parametrización Legal ───────────────────────────────────────
  getParametrosVigentes(fecha?: string): Observable<ParametroNominaVersion> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<ParametroNominaVersion>(`${this.base}/parametros/vigentes`, { params }).pipe(catchError(this.handleError));
  }

  createParametroVersion(dto: any): Observable<ParametroNominaVersion> {
    return this.http.post<ParametroNominaVersion>(`${this.base}/parametros`, dto).pipe(catchError(this.handleError));
  }

  // ── Configuración Contable de Nómina ─────────────────────────────
  getConfiguracionesContables(): Observable<any> {
    return this.http.get(`${this.base}/configuracion-contable`).pipe(catchError(this.handleError));
  }

  saveConfiguracionContable(area: string, configuracion: any): Observable<any> {
    return this.http.post(`${this.base}/configuracion-contable`, { area, configuracion }).pipe(catchError(this.handleError));
  }

  // ── Reportes ────────────────────────────────────────────────────
  getReporteCostosCentroCosto(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get(`${this.base}/reportes/costos-centro-costo`, { params }).pipe(catchError(this.handleError));
  }

  getReporteCostosCargo(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get(`${this.base}/reportes/costos-cargo`, { params }).pipe(catchError(this.handleError));
  }

  getReporteComparativo(periodo1Id: string, periodo2Id: string): Observable<any> {
    return this.http.get(`${this.base}/reportes/comparativo`, {
      params: new HttpParams().set('periodo1Id', periodo1Id).set('periodo2Id', periodo2Id),
    }).pipe(catchError(this.handleError));
  }

  getReporteResumenAportes(periodoId: string): Observable<any> {
    return this.http.get(`${this.base}/reportes/resumen-aportes/${periodoId}`).pipe(catchError(this.handleError));
  }
}
