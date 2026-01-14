import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, delay, map, Observable, of, Subject, tap } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { ErrorAuthResponse, JwtPayload, LoginResponse } from '../interfaces/auth-response.interface';
import { User } from '../interfaces/user.interface';
import { ResponseResult } from '@shared/interfaces/services.interfaces';
import { MenuService } from '@utils/services/menu.service';
import { jwtDecode } from 'jwt-decode';
import { Permission, UserRole } from '@dashboard/interfaces/permission-interface';
import { Router } from '@angular/router';


const baseURL = environment.baseUrl;
type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // private menuService = inject(MenuService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(sessionStorage.getItem('token'));

  token = computed(() => this._token());
  user = computed(() => this._user());
  authStatus = computed(() => this._authStatus());

  private authEvents = new Subject<'login' | 'logout'>();
  authEvents$ = this.authEvents.asObservable();

  login(email: string, password: string): Observable<ResponseResult>{

    return this.http.post<LoginResponse>(`${baseURL}/auth/login`, { email, password })
      .pipe(
          delay(3000),
          map((auth: LoginResponse): ResponseResult => {
              this.handleAuthSuccess(auth)
              return { success: true }
          }),
          catchError((error: any): Observable<ResponseResult> => {
            this.logout();
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
    sessionStorage.removeItem('token');
    this._user.set(null);
    this._token.set(null);
    this._authStatus.set('not-authenticated');
    this.authEvents.next('logout');
    // this.menuService.menuReset();
    
  }

  private handleAuthSuccess({ token, user, menu }: LoginResponse){
      sessionStorage.setItem('token', token);
      const decoded = jwtDecode<JwtPayload>(token);

      const userAuth: User = {
        id: decoded.sub,
        email: decoded.email,
        fullName: user.fullName,
        role: decoded.role,
        permissions: decoded.permissions,
        lastLogin: new Date(),
        createdAt: user.createdAt
      };
      
      this._user.set(userAuth);
      this._token.set(token);
      this.authEvents.next('login');
      this._authStatus.set('authenticated');

      // Cargar menú dinámico
      // this.menuService.fetchMenu().subscribe();

      return true;
  }

  private handleAuthError(error: any) {
    this.logout()
    console.log(error);

    return of(false);
  }

  hasPermission(permission: Permission): boolean {
    const user = this._user(); 
    return user?.permissions?.includes(permission) || false;
  }

  hasRole(role: UserRole): boolean {
    return this._user()?.role === role;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  refreshToken(): Observable<any> {
    return this.http.post(`${baseURL}/auth/refresh`, {}).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

}
