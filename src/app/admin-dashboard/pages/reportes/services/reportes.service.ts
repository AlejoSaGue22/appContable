import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/app/environments/environment";

export interface EstadoResultados {
    periodo: { inicio: string; fin: string };
    ingresos: { total: number; detalle: any[] };
    costos: { total: number; detalle: any[] };
    utilidadBruta: number;
    gastos: { total: number; detalle: any[] };
    utilidadNeta: number;
}

export interface FlujoCaja {
    periodo: { inicio: string; fin: string };
    entradas: { total: number; detalle: any[] };
    salidas: { total: number; detalle: any[] };
    flujoNeto: number;
    saldoInicial: number;
    saldoFinal: number;
}

@Injectable({
    providedIn: 'root'
})
export class ReportesService {
    private readonly apiUrl = `${environment.baseUrl}/reportes`;

    constructor(private http: HttpClient) { }

    estadoResultados(fechaInicio: string, fechaFin: string): Observable<EstadoResultados> {
        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin);

        return this.http.get<EstadoResultados>(`${this.apiUrl}/estado-resultados`, { params });
    }

    flujoCaja(fechaInicio: string, fechaFin: string): Observable<FlujoCaja> {
        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin);

        return this.http.get<FlujoCaja>(`${this.apiUrl}/flujo-caja`, { params });
    }

    balanceGeneral(fecha: string): Observable<any> {
        const params = new HttpParams().set('fecha', fecha);
        return this.http.get(`${this.apiUrl}/balance-general`, { params });
    }
}