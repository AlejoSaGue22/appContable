// src/app/features/menu/services/menu.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem, CreateMenuDto, UpdateMenuDto } from '../interfaces/menu.interface';
import { environment } from 'src/app/environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly base = `${environment.baseUrl}/menu`;

  constructor(private http: HttpClient) {}

  // ── Lectura ───────────────────────────────────────────────────────

  /** Menú filtrado según el rol/permisos del usuario autenticado */
  getMyMenu(): Observable<ApiResponse<MenuItem[]>> {
    return this.http.get<ApiResponse<MenuItem[]>>(`${this.base}`);
  }

  /** Todos los ítems (admin — para el gestor de menú) */
  getAllMenu(): Observable<ApiResponse<MenuItem[]>> {
    return this.http.get<ApiResponse<MenuItem[]>>(`${this.base}/all`);
  }

  getMenuItem(id: string): Observable<ApiResponse<MenuItem>> {
    return this.http.get<ApiResponse<MenuItem>>(`${this.base}/${id}`);
  }

  getMenuForRole(role: string): Observable<ApiResponse<MenuItem[]>> {
    return this.http.get<ApiResponse<MenuItem[]>>(`${this.base}/role/${role}`);
  }

  // ── Escritura ─────────────────────────────────────────────────────

  createMenu(dto: CreateMenuDto): Observable<ApiResponse<MenuItem>> {
    return this.http.post<ApiResponse<MenuItem>>(`${this.base}`, dto);
  }

  updateMenu(id: string, dto: UpdateMenuDto): Observable<ApiResponse<MenuItem>> {
    return this.http.patch<ApiResponse<MenuItem>>(`${this.base}/${id}`, dto);
  }

  deleteMenu(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  // ── Toggles ───────────────────────────────────────────────────────

  toggleActive(id: string, isActive: boolean): Observable<ApiResponse<MenuItem>> {
    return this.http.patch<ApiResponse<MenuItem>>(
      `${this.base}/${id}/toggle-active`,
      { isActive },
    );
  }

  toggleVisible(id: string, isVisible: boolean): Observable<ApiResponse<MenuItem>> {
    return this.http.patch<ApiResponse<MenuItem>>(
      `${this.base}/${id}/toggle-visible`,
      { isVisible },
    );
  }

  // ── Reordenar ─────────────────────────────────────────────────────

  reorderMenu(body: { orderedIds: string[] }): Observable<ApiResponse<MenuItem[]>> {
    return this.http.post<ApiResponse<MenuItem[]>>(`${this.base}/reorder`, body);
  }

  // ── Seed ──────────────────────────────────────────────────────────

  seedMenu(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/seed`, {});
  }
}