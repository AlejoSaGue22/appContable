import { Routes } from '@angular/router';
import { ErrorPageComponent } from '@utils/components/error-page/error-page.component';

export default [
    {
        path: 'empleados',
        loadComponent: () => import('./empleados/empleados-page.component'),
    },
    {
        path: 'empleados/crear',
        loadComponent: () => import('./empleados/crear-empleado-page/crear-empleado-page.component'),
    },
    {
        path: 'empleados/:id/editar',
        loadComponent: () => import('./empleados/crear-empleado-page/crear-empleado-page.component'),
    },
    {
        path: 'empleados/:id/detalle',
        loadComponent: () => import('./empleados/detalle-empleado-page/detalle-empleado-page.component'),
    },
    {
        path: 'periodos',
        loadComponent: () => import('./periodos/periodos-page.component'),
    },
    {
        path: 'reportes',
        loadComponent: () => import('./reportes/nomina-reportes-page.component'),
    },
    {
        path: '**',
        redirectTo: 'empleados',
    },
] as Routes;
