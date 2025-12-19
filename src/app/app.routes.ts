import { Routes } from '@angular/router';
import { authenticatedGuardGuard } from './auth/guards/authenticated-guard.guard';
import { notAuthenticatedGuard } from './auth/guards/notAuthenticated.guard';

export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth.route'),
        canMatch: [notAuthenticatedGuard]
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./admin-dashboard/pages/admin-dashboard.routes'),
        canMatch: [authenticatedGuardGuard]
    },
    {
        path: '',
        loadChildren: () => import('./auth/auth.route'),
        canMatch: [notAuthenticatedGuard]
    }
];
