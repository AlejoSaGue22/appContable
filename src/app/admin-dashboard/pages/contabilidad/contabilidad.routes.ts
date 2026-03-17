import { Routes } from '@angular/router';
import CuentasContablesComponent from './cuentas-contables/cuentas-contables.component';

export default [
    {
        path: 'cuentas-contables',
        component: CuentasContablesComponent
    },
    {
        path: '**',
        redirectTo: 'cuentas-contables'
    }
] as Routes;
