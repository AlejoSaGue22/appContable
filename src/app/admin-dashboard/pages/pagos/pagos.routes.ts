import { CxcComponent } from "./cxc/cxc.component";
import { CxpComponent } from "./cxp/cxp.component";
import { AntiguedadComponent } from "./antiguedad/antiguedad.component";
import { MovimientosComponent } from "./movimientos/movimientos.component";
import { Routes } from "@angular/router";

export const pagosRoutes: Routes = [
    {
        path: 'cxc',
        component: CxcComponent
    },
    {
        path: 'cxc/nuevo',
        loadComponent: () => import('./cxc/recibo-caja-forms-page/recibo-caja-forms-page.component').then(m => m.ReciboCajaFormsPageComponent)
    },
    {
        path: 'cxp',
        component: CxpComponent
    },
    {
        path: 'cxp/nuevo',
        loadComponent: () => import('./cxp/comprobante-egreso-forms-page/comprobante-egreso-forms-page.component').then(m => m.ComprobanteEgresoFormsPageComponent)
    },
    {
        path: 'movimientos',
        component: MovimientosComponent
    },
    {
        path: 'aging',
        component: AntiguedadComponent
    },
    {
        path: '**',
        redirectTo: 'cxc'
    }
]

export default pagosRoutes;
