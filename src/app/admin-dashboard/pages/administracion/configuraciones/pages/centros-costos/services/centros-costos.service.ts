import { inject, Injectable, signal } from '@angular/core';
import {
  CentroCostoInterface,
  CreateCentroCostoDto,
  UpdateCentroCostoDto,
} from '../interfaces/centros-costos.interface';
import { map, Observable, tap } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CentrosCostosService {
  private readonly baseUrl = environment.baseUrl;
  private readonly http = inject(HttpClient);

  // Señales para el estado
  public centrosCostos = signal<CentroCostoInterface[]>([]);
  public isLoading = signal<boolean>(false);

  constructor() {}

  /**
   * Carga todos los centros de costo y actualiza la señal
   */
  loadCentrosCostos(): Observable<CentroCostoInterface[]> {
    this.isLoading.set(true);
    return this.http
      .get<CentroCostoInterface[]>(`${this.baseUrl}/settings/centros-costos`)
      .pipe(
        tap((centros) => {
          this.centrosCostos.set(centros);
          this.isLoading.set(false);
        }),
      );
  }

  /**
   * Crea un nuevo centro de costo
   */
  createCentroCosto(
    centroCosto: CreateCentroCostoDto,
  ): Observable<CentroCostoInterface> {
    return this.http
      .post<CentroCostoInterface>(
        `${this.baseUrl}/settings/centros-costos`,
        centroCosto,
      )
      .pipe(
        tap((newCentro) => {
          this.centrosCostos.update((current) =>
            [...current, newCentro].sort((a, b) =>
              a.nombre.localeCompare(b.nombre),
            ),
          );
        }),
      );
  }

  /**
   * Actualiza un centro de costo existente
   */
  updateCentroCosto(
    id: string,
    centroCosto: UpdateCentroCostoDto,
  ): Observable<CentroCostoInterface> {
    return this.http
      .patch<CentroCostoInterface>(
        `${this.baseUrl}/settings/centros-costos/${id}`,
        centroCosto,
      )
      .pipe(
        tap((updatedCentro) => {
          this.centrosCostos.update((current) =>
            current.map((c) => (c.id === id ? updatedCentro : c)),
          );
        }),
      );
  }

  /**
   * Elimina un centro de costo
   */
  deleteCentroCosto(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/settings/centros-costos/${id}`)
      .pipe(
        tap(() => {
          this.centrosCostos.update((current) =>
            current.filter((c) => c.id !== id),
          );
        }),
      );
  }
}
