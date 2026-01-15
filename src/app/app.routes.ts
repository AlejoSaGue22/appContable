import { Routes } from '@angular/router';
import { authenticatedGuardGuard } from './auth/guards/authenticated-guard.guard';
import { notAuthenticatedGuard } from './auth/guards/notAuthenticated.guard';
import { ErrorPageComponent } from '@utils/components/error-page/error-page.component';

export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth.route'),
        canMatch: [notAuthenticatedGuard]
    },
    {
        path: 'panel',
        loadChildren: () => import('./admin-dashboard/pages/admin-dashboard.routes'),
        canMatch: [authenticatedGuardGuard]
    },
    {
        path: '',
        loadChildren: () => import('./auth/auth.route'),
        canMatch: [notAuthenticatedGuard]
    }
];
