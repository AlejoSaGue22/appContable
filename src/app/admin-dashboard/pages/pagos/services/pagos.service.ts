// src/app/pagos/services/pagos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/app/environments/environment';
import { AgingReporte, CuentaBancaria, CxcResponse, CxpResponse, HistorialPagosResponse, PagoHistorial, 
         PagoResponseDto, PaymentStatus, RegistrarCobroDto, RegistrarPagoDto, ResumenCartera, CxFiltros,
         PagoHistorialResponse
} from '@dashboard/interfaces/pagos-interface';


@Injectable({ providedIn: 'root' })
export class PagosHttpService {
  private readonly base = `${environment.baseUrl}`;

  constructor(private http: HttpClient) {}

  // ── Resumen (dashboard) ────────────────────────────────────────────────
  getResumenCartera(): Observable<ResumenCartera> {
    return this.http
      .get<ResumenCartera>(`${this.base}/reportes/cartera/resumen`)
      .pipe(map(r => r));
  }

  // ── CxC ───────────────────────────────────────────────────────────────
  getCxc(filtros: CxFiltros): Observable<CxcResponse> {
    let params = new HttpParams();
    if (filtros?.clienteId)     params = params.set('clienteId',     filtros.clienteId);
    if (filtros?.paymentStatus) params = params.set('paymentStatus', filtros.paymentStatus);
    if (filtros?.soloVencidas)  params = params.set('soloVencidas',  'true');
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
    if (filtros?.proveedorId)   params = params.set('proveedorId',   filtros.proveedorId);
    if (filtros?.paymentStatus) params = params.set('paymentStatus', filtros.paymentStatus);
    if (filtros?.soloVencidas)  params = params.set('soloVencidas',  'true');
    params = params.set('page',   filtros.page.toString());
    params = params.set('limit',  filtros.limit.toString());
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
  getAgingCobrar(): Observable<AgingReporte> {
    return this.http
      .get<AgingReporte>(`${this.base}/reportes/cartera/aging-cobrar`);
  }

  getAgingPagar(): Observable<AgingReporte> {
    return this.http
      .get<AgingReporte>(`${this.base}/reportes/cartera/aging-pagar`);
  }

  // ── Historial global ──────────────────────────────────────────────────
  getHistorialGlobal(fechaInicio: string, fechaFin: string): Observable<HistorialPagosResponse> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin',    fechaFin);
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
}