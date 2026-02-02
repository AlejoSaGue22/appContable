import { Routes } from "@angular/router";
import { EstadoResultadoComponent } from "./estado-resultado/estado-resultado.component";

export const routes: Routes = [
    {
        path: '',
        component: EstadoResultadoComponent
    },
    {
        path: '**',
        redirectTo: ''
    }
]

export default routes;
