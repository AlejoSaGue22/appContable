import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { MenuService } from '@utils/services/menu.service';

export const authenticatedGuardGuard: CanMatchFn = async (route, segments) => {

  const authServices = inject(AuthService);
  const router = inject(Router);
  const menuService = inject(MenuService);

  const isAuthenticated = await firstValueFrom(authServices.checkStatus());

  if (!isAuthenticated) {
      await router.navigateByUrl("/");
      return false;
  }

  // const url = '/' + segments.join('/');
  // if (!menuService.hasAccessToRoute(url)) {
  //   await router.navigateByUrl("/");
  //   return false;
  // }

  return true;

};


