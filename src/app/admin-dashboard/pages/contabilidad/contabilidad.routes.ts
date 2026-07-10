import { Routes } from '@angular/router';
import CuentasBancariasComponent from './cuentas-bancarias/cuentas-bancarias.component';
import { CuentasContablesComponent } from './cuentas-contables/cuentas-contables.component';
import { ComprobantesComponent } from './comprobantes/comprobantes.component';
import { ComprobanteFormComponent } from './comprobantes/comprobante-form/comprobante-form.component';

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
    path: 'comprobantes',
    component: ComprobantesComponent
  },
  {
    path: 'comprobantes/nuevo',
    component: ComprobanteFormComponent
  },
  {
    path: 'comprobantes/editar/:id',
    component: ComprobanteFormComponent
  },
  {
    path: 'comprobantes/:id',
    component: ComprobanteFormComponent
  },
  {
    path: '**',
    redirectTo: 'cuentas-contables'
  }
] as Routes;

