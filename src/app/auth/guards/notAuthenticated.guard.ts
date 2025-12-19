import { inject } from "@angular/core";
import { CanMatchFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { firstValueFrom } from "rxjs";

export const notAuthenticatedGuard: CanMatchFn = async (route, segments) => {

    const authServices = inject(AuthService);
    const router = inject(Router);

    const isAuthenticated = await firstValueFrom(authServices.checkStatus());

    if (isAuthenticated) {
        router.navigateByUrl('/dashboard');
        return false;
    }

    return true;
};