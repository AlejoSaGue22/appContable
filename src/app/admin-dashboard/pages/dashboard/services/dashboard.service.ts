import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardHistory, DashboardResponse, RecentTransaction } from '@dashboard/interfaces/dashboard.interface';
import { environment } from 'src/app/environments/environment';
import { DashboardAvanzadoKPIs } from '../../../interfaces/reportes-avanzados.interface';

const baseUrl = environment.baseUrl;

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);

    getSummary(period: string = 'current_month'): Observable<DashboardResponse> {
        return this.http.get<DashboardResponse>(`${baseUrl}/dashboard/summary`, { params: { period } });
    }

    getDashboardAvanzado(): Observable<DashboardAvanzadoKPIs> {
        return this.http.get<DashboardAvanzadoKPIs>(`${baseUrl}/reportes/dashboard-avanzado`);
    }
}
