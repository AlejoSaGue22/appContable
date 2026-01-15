import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { inject } from "@angular/core";


// Guard para roles específicos
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.user();
    if (!user) {
      router.navigate(['/']);
      return false;
    }

    if (!allowedRoles.includes(user.role)) {
      router.navigate(['/panel/dashboard']);
      return false;
    }

    return true;
  };
};