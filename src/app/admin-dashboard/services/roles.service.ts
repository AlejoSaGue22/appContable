import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { ApiResponse, CreateRoleDto, Role, UpdateRoleDto } from '../interfaces/roles.interface';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private readonly baseUrl = `${environment.baseUrl}/roles`;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(this.baseUrl);
  }

  getRoleById(id: string): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.baseUrl}/${id}`);
  }

  getRoleByName(name: string): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.baseUrl}/name/${name}`);
  }

  createRole(dto: CreateRoleDto): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.baseUrl, dto);
  }

  updateRole(id: string, dto: UpdateRoleDto): Observable<ApiResponse<Role>> {
    return this.http.patch<ApiResponse<Role>>(`${this.baseUrl}/${id}`, dto);
  }

  deleteRole(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  addPermissionToRole(id: string, permission: string): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(`${this.baseUrl}/${id}/permissions/${permission}`, {});
  }

  removePermissionFromRole(id: string, permission: string): Observable<ApiResponse<Role>> {
    return this.http.delete<ApiResponse<Role>>(`${this.baseUrl}/${id}/permissions/${permission}`);
  }

  seedRoles(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/seed`, {});
  }
}
