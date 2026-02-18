import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardResponse } from '@dashboard/interfaces/dashboard.interface';
import { environment } from 'src/app/environments/environment';

const baseUrl = environment.baseUrl;

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);

    getSummary(): Observable<DashboardResponse> {
        return this.http.get<DashboardResponse>(`${baseUrl}/dashboard/summary`);
    }
}
