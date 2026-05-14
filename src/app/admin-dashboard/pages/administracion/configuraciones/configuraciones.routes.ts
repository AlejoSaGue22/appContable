import { Routes } from "@angular/router";
import { ConfiguracionMenuComponent } from "./configuracion-menu/configuracion-menu.component";
import { EmpresaComponent } from "./pages/empresa/empresa.component";
import { ImpuestosComponent } from "./pages/impuestos/impuestos.component";

const configuracionesRoutes: Routes = [
    {
        path: '',
        component: ConfiguracionMenuComponent
    },
    {
        path: 'empresa',
        component: EmpresaComponent
    },
    {
        path: 'impuestos',
        component: ImpuestosComponent
    },
    {
        path: '**',
        redirectTo: ''
    }
];

export default configuracionesRoutes;
