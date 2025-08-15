import { Routes } from "@angular/router";
import AdminLayoutsComponent from "./layouts/admin-layouts/admin-layouts.component";
import { DashboargPageComponent } from "./pages/dashboard/dashboarg-page.component";
import { ClientsPageComponent } from "./pages/clientes/clients-page.component";

export const routes: Routes = [
    {
        path: '',
        component: AdminLayoutsComponent,
        children: [
            {
                path: 'index',
                component: DashboargPageComponent
            },
            {
                path: 'clients',
                component: ClientsPageComponent
            },
            {
                path: '**',
                redirectTo: 'dashboard'
            }
        ]
    }
]


export default routes;