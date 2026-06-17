import { Routes } from '@angular/router';

export default [
 {
 path: 'empleados',
 loadComponent: () => import('./empleados/empleados-page.component'),
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
