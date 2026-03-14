// src/app/pagos/services/pagos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { AgingReporte, CuentaBancaria, CxcResponse, CxpResponse, HistorialPagosResponse, PagoHistorial, PaymentStatus, RegistrarCobroDto, RegistrarPagoDto, ResumenCartera } from '@dashboard/interfaces/pagos-interface';


@Injectable({ providedIn: 'root' })
export class PagosHttpService {
  private readonly base = `${environment.baseUrl}`;

  constructor(private http: HttpClient) {}

  // ── Resumen (dashboard) ────────────────────────────────────────────────
  getResumenCartera(): Observable<ResumenCartera> {
    return this.http.get<ResumenCartera>(`${this.base}/reportes/cartera/resumen`);
  }

  // ── CxC ───────────────────────────────────────────────────────────────
  getCxc(filtros?: { clienteId?: string; paymentStatus?: PaymentStatus;soloVencidas?: boolean; }): Observable<CxcResponse> {
    let params = new HttpParams();
    if (filtros?.clienteId)     params = params.set('clienteId',     filtros.clienteId);
    if (filtros?.paymentStatus) params = params.set('paymentStatus', filtros.paymentStatus);
    if (filtros?.soloVencidas)  params = params.set('soloVencidas',  'true');
    return this.http.get<CxcResponse>(`${this.base}/cxc`, { params });
  }

  getHistorialCobros(facturaVentaId: string): Observable<PagoHistorial[]> {
    return this.http.get<PagoHistorial[]>(`${this.base}/cxc/${facturaVentaId}/historial`);
  }

  registrarCobro(facturaVentaId: string, dto: RegistrarCobroDto): Observable<any> {
    return this.http.post(`${this.base}/cxc/${facturaVentaId}/cobro`, dto);
  }

  // ── CxP ───────────────────────────────────────────────────────────────
  getCxp(filtros?: { proveedorId?: string; paymentStatus?: PaymentStatus; soloVencidas?: boolean; }): Observable<CxpResponse> {
    let params = new HttpParams();
    if (filtros?.proveedorId)   params = params.set('proveedorId',   filtros.proveedorId);
    if (filtros?.paymentStatus) params = params.set('paymentStatus', filtros.paymentStatus);
    if (filtros?.soloVencidas)  params = params.set('soloVencidas',  'true');
    return this.http.get<CxpResponse>(`${this.base}/cxp`, { params });
  }

  getHistorialPagos(facturaCompraId: string): Observable<PagoHistorial[]> {
    return this.http.get<PagoHistorial[]>(`${this.base}/cxp/${facturaCompraId}/historial`);
  }

  registrarPago(facturaCompraId: string, dto: RegistrarPagoDto): Observable<any> {
    return this.http.post(`${this.base}/cxp/${facturaCompraId}/pago`, dto);
  }

  // ── Aging ─────────────────────────────────────────────────────────────
  getAgingCobrar(): Observable<AgingReporte> {
    return this.http.get<AgingReporte>(`${this.base}/reportes/cartera/aging-cobrar`);
  }

  getAgingPagar(): Observable<AgingReporte> {
    return this.http.get<AgingReporte>(`${this.base}/reportes/cartera/aging-pagar`);
  }

  // ── Historial global ──────────────────────────────────────────────────
  getHistorialGlobal(fechaInicio: string, fechaFin: string): Observable<HistorialPagosResponse> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin',    fechaFin);
    return this.http.get<HistorialPagosResponse>(
      `${this.base}/reportes/cartera/historial-pagos`,
      { params },
    );
  }

  // ── Cuentas bancarias ─────────────────────────────────────────────────
  getCuentasBancarias(): Observable<CuentaBancaria[]> {
    return this.http.get<CuentaBancaria[]>(`${this.base}/cuentas-bancarias`);
  }
}