import { Routes } from '@angular/router';
import CuentasBancariasComponent from './cuentas-bancarias/cuentas-bancarias.component';
import { CuentasContablesComponent } from './cuentas-contables/cuentas-contables.component';
import { ComprobantesComponent } from './comprobantes/comprobantes.component';
import { ComprobanteFormComponent } from './comprobantes/comprobante-form/comprobante-form.component';
import { ActivosFijosComponent } from './activos-fijos/activos-fijos.component';
import { ActivosFijosFormComponent } from './activos-fijos/activos-fijos-form/activos-fijos-form.component';

export default [
  {
    path: 'cuentas-contables',
    component: CuentasContablesComponent
  },
  {
    path: 'activos-fijos',
    component: ActivosFijosComponent
  },
  {
    path: 'activos-fijos/nuevo',
    component: ActivosFijosFormComponent
  },
  {
    path: 'activos-fijos/editar/:id',
    component: ActivosFijosFormComponent
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

