import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import {
  NumberingRange,
  NumberingRangeDomain,
  NumberingRangeListResponse,
  SyncRangesResponse,
} from '../interfaces/numbering-range.interface';

@Injectable({
  providedIn: 'root',
})
export class NumberingRangesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}/numbering-ranges`;

  list(filters?: {
    domain?: NumberingRangeDomain;
    document?: string;
    isActive?: boolean;
  }): Observable<NumberingRangeListResponse> {
    const params: any = {};
    if (filters?.domain) params.domain = filters.domain;
    if (filters?.document) params.document = filters.document;
    if (filters?.isActive !== undefined) params.isActive = String(filters.isActive);
    return this.http.get<NumberingRangeListResponse>(this.apiUrl, { params });
  }

  sync(domain?: NumberingRangeDomain): Observable<SyncRangesResponse> {
    return this.http.post<SyncRangesResponse>(`${this.apiUrl}/sync`, domain ? { domain } : {});
  }

  getById(id: number, domain?: NumberingRangeDomain, refresh = false): Observable<{ success: boolean; data: NumberingRange | null; message: string }> {
    const params: any = {};
    if (domain) params.domain = domain;
    if (refresh) params.refresh = 'true';
    return this.http.get<{ success: boolean; data: NumberingRange | null; message: string }>(
      `${this.apiUrl}/${id}`,
      { params },
    );
  }

  create(domain: NumberingRangeDomain, payload: Record<string, unknown>): Observable<{ success: boolean; data: NumberingRange; message: string }> {
    return this.http.post<{ success: boolean; data: NumberingRange; message: string }>(this.apiUrl, {
      domain,
      payload,
    });
  }

  remove(id: number, domain?: NumberingRangeDomain): Observable<{ success: boolean; data: null; message: string }> {
    const params: any = {};
    if (domain) params.domain = domain;
    return this.http.delete<{ success: boolean; data: null; message: string }>(`${this.apiUrl}/${id}`, {
      params,
    });
  }

  toggleStatus(id: number, domain?: NumberingRangeDomain): Observable<{ success: boolean; data: NumberingRange; message: string }> {
    const params: any = {};
    if (domain) params.domain = domain;
    return this.http.patch<{ success: boolean; data: NumberingRange; message: string }>(
      `${this.apiUrl}/${id}/toggle-status`,
      {},
      { params },
    );
  }

  updateCurrent(
    id: number,
    current: number,
    domain?: NumberingRangeDomain,
  ): Observable<{ success: boolean; data: NumberingRange; message: string }> {
    return this.http.patch<{ success: boolean; data: NumberingRange; message: string }>(
      `${this.apiUrl}/${id}/current`,
      domain ? { current, domain } : { current },
    );
  }
}
