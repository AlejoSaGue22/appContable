import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import {
  ComprobanteContableInterface,
  CreateComprobanteContableDto,
  UpdateComprobanteContableDto,
} from '../interfaces/comprobantes.interface';

@Injectable({
  providedIn: 'root',
})
export class ComprobantesService {
  private readonly baseUrl = environment.baseUrl;
  private readonly http = inject(HttpClient);

  public comprobantes = signal<ComprobanteContableInterface[]>([]);
  public isLoading = signal<boolean>(false);

  loadComprobantes(): Observable<ComprobanteContableInterface[]> {
    this.isLoading.set(true);
    return this.http
      .get<ComprobanteContableInterface[]>(`${this.baseUrl}/comprobantes`)
      .pipe(
        tap((data) => {
          this.comprobantes.set(data);
          this.isLoading.set(false);
        }),
      );
  }

  findOne(id: string): Observable<ComprobanteContableInterface> {
    return this.http.get<ComprobanteContableInterface>(`${this.baseUrl}/comprobantes/${id}`);
  }

  create(dto: CreateComprobanteContableDto): Observable<ComprobanteContableInterface> {
    return this.http
      .post<ComprobanteContableInterface>(`${this.baseUrl}/comprobantes`, dto)
      .pipe(
        tap((newComp) => {
          this.comprobantes.update((current) => [newComp, ...current]);
        }),
      );
  }

  update(id: string, dto: UpdateComprobanteContableDto): Observable<ComprobanteContableInterface> {
    return this.http
      .patch<ComprobanteContableInterface>(`${this.baseUrl}/comprobantes/${id}`, dto)
      .pipe(
        tap((updated) => {
          this.comprobantes.update((current) =>
            current.map((c) => (c.id === id ? updated : c)),
          );
        }),
      );
  }

  contabilizar(id: string): Observable<ComprobanteContableInterface> {
    return this.http
      .post<ComprobanteContableInterface>(`${this.baseUrl}/comprobantes/${id}/contabilizar`, {})
      .pipe(
        tap((updated) => {
          this.comprobantes.update((current) =>
            current.map((c) => (c.id === id ? updated : c)),
          );
        }),
      );
  }

  anular(id: string, motivoAnulacion: string): Observable<ComprobanteContableInterface> {
    return this.http
      .post<ComprobanteContableInterface>(`${this.baseUrl}/comprobantes/${id}/anular`, { motivoAnulacion })
      .pipe(
        tap((updated) => {
          this.comprobantes.update((current) =>
            current.map((c) => (c.id === id ? updated : c)),
          );
        }),
      );
  }

  preview(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/asientos-contables/preview/COMPROBANTE_CONTABLE/${id}`,
    );
  }
}
