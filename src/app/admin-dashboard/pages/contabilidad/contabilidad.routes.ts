import { Routes } from '@angular/router';
import CuentasBancariasComponent from './cuentas-bancarias/cuentas-bancarias.component';
import { CuentasContablesComponent } from './cuentas-contables/cuentas-contables.component';

export default [
    {
        path: 'cuentas-contables',
        component: CuentasContablesComponent
    },
    {
        path: 'bancos',
        component: CuentasBancariasComponent
    },
    {
        path: '**',
        redirectTo: 'cuentas-contables'
    }
] as Routes;

