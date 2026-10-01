import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import {
  TipoComprobanteInterface,
  CreateTipoComprobanteDto,
  UpdateTipoComprobanteDto,
} from '../interfaces/tipo-comprobante.interface';

@Injectable({
  providedIn: 'root',
})
export class TipoComprobanteService {
  private readonly baseUrl = environment.baseUrl;
  private readonly http = inject(HttpClient);

  public tipos = signal<TipoComprobanteInterface[]>([]);
  public isLoading = signal<boolean>(false);

  loadTipos(): Observable<TipoComprobanteInterface[]> {
    this.isLoading.set(true);
    return this.http
      .get<TipoComprobanteInterface[]>(`${this.baseUrl}/comprobantes/tipos`)
      .pipe(
        tap((data) => {
          this.tipos.set(data);
          this.isLoading.set(false);
        }),
      );
  }

  createTipo(dto: CreateTipoComprobanteDto): Observable<TipoComprobanteInterface> {
    return this.http
      .post<TipoComprobanteInterface>(`${this.baseUrl}/comprobantes/tipos`, dto)
      .pipe(
        tap((newTipo) => {
          this.tipos.update((current) =>
            [...current, newTipo].sort((a, b) => a.nombre.localeCompare(b.nombre)),
          );
        }),
      );
  }

  updateTipo(id: string, dto: UpdateTipoComprobanteDto): Observable<TipoComprobanteInterface> {
    return this.http
      .patch<TipoComprobanteInterface>(`${this.baseUrl}/comprobantes/tipos/${id}`, dto)
      .pipe(
        tap((updated) => {
          this.tipos.update((current) =>
            current.map((t) => (t.id === id ? updated : t)),
          );
        }),
      );
  }
}
