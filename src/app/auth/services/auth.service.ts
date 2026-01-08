import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, delay, map, Observable, of } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { ErrorAuthResponse, LoginResponse } from '../interfaces/auth-response.interface';
import { User } from '../interfaces/user.interface';
import { ResponseResult } from '@shared/interfaces/services.interfaces';


const baseURL = environment.baseUrl;
type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(sessionStorage.getItem('token'));

  token = computed(() => this._token());
  user = computed(() => this._user());

  login(email: string, password: string): Observable<ResponseResult>{

    return this.http.post<LoginResponse>(`${baseURL}/auth/login`, { email, password })
      .pipe(
          delay(3000),
          map((auth: LoginResponse): ResponseResult => {
              this.handleAuthSuccess(auth)
              return { success: true }
          }),
          catchError((error: any): Observable<ResponseResult> => {
            this.logout()
            const errorResp: ErrorAuthResponse = error?.error ?? {
              message: 'Error desconocido en autenticación',
              error: 'Unknown',
              statusCode: 500,
            };

            return of({ success: false, error: errorResp })
          }),
      )
  }

  register(fullname: string, email: string, password: string): Observable<boolean>{

    return this.http.post<LoginResponse>(`${baseURL}/auth/register`, { fullname, email, password }).pipe(
        map((auth) => this.handleAuthSuccess(auth))
    )
  }

  checkStatus(): Observable<boolean>{
      const token = sessionStorage.getItem("token");

      if (!token) {
        this.logout();
        return of(false);
      }

      return this.http.get<LoginResponse>(`${baseURL}/auth/check-status`,{
        // headers: {
        //   Authorization: `Bearer ${token}`
        // }
      }).pipe(
        map((resp) => {
          const result = this.handleAuthSuccess(resp)

          return result;
        }),
        catchError((error: any) => this.handleAuthError(error))
      )

  }

  logout(){
    this._user.set(null);
    this._token.set(null);
    this._authStatus.set('not-authenticated')

    sessionStorage.removeItem('token');
  }

  private handleAuthSuccess({ token, user }: LoginResponse){
      this._user.set(user);
      this._token.set(token);
      this._authStatus.set('authenticated');

      sessionStorage.setItem('token', token);

      return true;
  }

  private handleAuthError(error: any) {
    this.logout()
    console.log(error);

    return of(false);
  }

}
