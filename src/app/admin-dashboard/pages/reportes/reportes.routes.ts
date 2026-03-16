import { Routes } from "@angular/router";
import { ReportesGeneralComponent } from "./reportes-general/reportes-general.component";
import { ReportesCarteraComponent } from "./reportes-cartera/reportes-cartera.component";

export const routes: Routes = [
    {
        path: 'reports-general',
        component: ReportesGeneralComponent
    },
    {
        path: 'reports-cartera',
        component: ReportesCarteraComponent
    },
    {
        path: '**',
        redirectTo: 'reports-general'
    }
];

export default routes;
