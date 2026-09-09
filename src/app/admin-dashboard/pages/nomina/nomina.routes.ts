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
        path: 'periodos/:id/detalle',
        loadComponent: () => import('./periodos/periodo-detalle-page/periodo-detalle-page.component'),
    },
    {
        path: 'periodos/:id/empleado/:empleadoId',
        loadComponent: () => import('./periodos/empleado-detalle-page/empleado-detalle-page.component'),
    },
    {
        path: 'periodos/:id/generar-pago',
        loadComponent: () => import('./periodos/generar-pago-page/generar-pago-page.component'),
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
        path: 'tesoreria',
        loadComponent: () => import('./tesoreria/tesoreria-page.component')
    },
    {
        path: '**',
        redirectTo: 'empleados',
    },
] as Routes;
