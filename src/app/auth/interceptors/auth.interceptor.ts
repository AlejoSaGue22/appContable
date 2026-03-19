import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) {
  const authService = inject(AuthService);
  const token = authService.token();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.append('Authorization', `Bearer ${token}`),
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        return authService.refreshToken().pipe(
          switchMap((success) => {
            if (success) {
              const newToken = authService.token();
              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${newToken}`),
              });
              return next(retryReq);
            }
            authService.logout();
            return throwError(() => error);
          }),
          catchError((refreshError) => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
}