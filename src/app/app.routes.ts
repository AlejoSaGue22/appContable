import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'dashboard',
        loadChildren: () => import('./admin-dashboard/pages/admin-dashboard.routes')
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
