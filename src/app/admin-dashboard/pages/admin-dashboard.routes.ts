import { Routes } from "@angular/router";
import AdminLayoutsComponent from "@dashboard/layouts/admin-layouts/admin-layouts.component";
import { DashboargPageComponent } from "./dashboard/dashboarg-page.component";

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
                path: 'ventas',
                loadChildren: () => import('./ventas/ventas.routes')
            },
            {
                path: '**',
                redirectTo: 'index'
            }
        ]
    }
]


export default routes;