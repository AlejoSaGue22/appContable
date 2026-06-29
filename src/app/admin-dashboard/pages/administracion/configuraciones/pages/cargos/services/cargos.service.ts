import { HttpClient } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CargoInterface, CreateCargoDto, UpdateCargoDto } from '../interfaces/cargos.interface';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CargosService {
  private readonly baseUrl = environment.baseUrl;
  private readonly http = inject(HttpClient);

  // Señales para el estado
  public cargos = signal<CargoInterface[]>([]);
  public isLoading = signal<boolean>(false);

  constructor() { }

  /**
   * Carga todos los cargos y actualiza la señal
   */
  loadCargos(): Observable<CargoInterface[]> {
    this.isLoading.set(true);
    return this.http.get<CargoInterface[]>(`${this.baseUrl}/settings/cargos`)
      .pipe(
        tap(cargos => {
          this.cargos.set(cargos);
          this.isLoading.set(false);
        })
      );
  }

  /**
   * Crea un nuevo cargo
   */
  createCargo(cargo: CreateCargoDto): Observable<CargoInterface> {
    return this.http.post<CargoInterface>(`${this.baseUrl}/settings/cargos`, cargo)
      .pipe(
        tap(newCargo => {
          this.cargos.update(current => [...current, newCargo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        })
      );
  }

  /**
   * Actualiza un cargo existente
   */
  updateCargo(id: string, cargo: UpdateCargoDto): Observable<CargoInterface> {
    return this.http.patch<CargoInterface>(`${this.baseUrl}/settings/cargos/${id}`, cargo)
      .pipe(
        tap(updatedCargo => {
          this.cargos.update(current => 
            current.map(c => c.id === id ? updatedCargo : c)
          );
        })
      );
  }

  /**
   * Elimina un cargo
   */
  deleteCargo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/settings/cargos/${id}`)
      .pipe(
        tap(() => {
          this.cargos.update(current => current.filter(c => c.id !== id));
        })
      );
  }
}
