import { Routes } from '@angular/router';

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
        path: 'periodos/:id/gestionar',
        loadComponent: () => import('./periodos/gestionar-periodo-page/gestionar-periodo-page.component'),
    },
    {
        path: 'configuracion',
        loadComponent: () => import('./configuracion/configuracion-page.component'),
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
