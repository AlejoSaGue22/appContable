import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/app/environments/environment';
import { Options, ResponseResult } from '@shared/interfaces/services.interfaces';
import { catchError, map, Observable, of } from 'rxjs';
import { User, UsersResponse, Role } from 'src/app/admin-dashboard/interfaces/users-interface';

const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class UsersService {

    private http = inject(HttpClient);

    getUsers(options: Options): Observable<UsersResponse> {
        const { limit = 10, offset = 0, search = '' } = options;

        return this.http.get<UsersResponse>(`${baseUrl}/users`, {
            params: {
                limit,
                offset,
                search
            }
        });
    }

    getUsersById(id: string): Observable<User> {
        return this.http.get<any>(`${baseUrl}/users/${id}`).pipe(
            map(resp => resp.data || resp)
        );
    }

    getRoles(): Observable<Role[]> {
        return this.http.get<any>(`${baseUrl}/roles`).pipe(
            map(resp => resp.data || resp)
        );
    }

    createUser(user: any): Observable<ResponseResult> {
        return this.http.post(`${baseUrl}/users`, user).pipe(
            map((resp): ResponseResult => ({ success: true, data: resp })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        );
    }

    updateUser(id: string, user: any): Observable<ResponseResult> {
        return this.http.patch(`${baseUrl}/users/${id}`, user).pipe(
            map((resp): ResponseResult => ({ success: true, data: resp })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        );
    }

    deleteUser(id: string): Observable<ResponseResult> {
        return this.http.delete(`${baseUrl}/users/${id}`).pipe(
            map((resp): ResponseResult => ({ success: true, data: resp })),
            catchError((error: any): Observable<ResponseResult> => of({ success: false, error, message: error.error.message }))
        );
    }
}
