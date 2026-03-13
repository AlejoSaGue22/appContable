import { CxcComponent } from "./cxc/cxc.component";
import { CxpComponent } from "./cxp/cxp.component";
import { AntiguedadComponent } from "./antiguedad/antiguedad.component";
import { Routes } from "@angular/router";

export const pagosRoutes: Routes = [
    {
        path: 'cxc',
        component: CxcComponent
    },
    {
        path: 'cxp',
        component: CxpComponent
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