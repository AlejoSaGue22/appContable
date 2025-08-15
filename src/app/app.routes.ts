import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'dashboard',
        loadChildren: () => import('./admin-dashboard/admin-dashboard.routes')
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
