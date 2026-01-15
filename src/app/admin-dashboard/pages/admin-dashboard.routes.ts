import { Routes } from "@angular/router";
import AdminLayoutsComponent from "@dashboard/layouts/admin-layouts/admin-layouts.component";
import { DashboargPageComponent } from "./dashboard/dashboarg-page.component";

export const routes: Routes = [
    {
        path: '',
        component: AdminLayoutsComponent,
        children: [
            {
                path: 'dashboard',
                component: DashboargPageComponent
            },
            {
                path: 'ventas',
                loadChildren: () => import('./ventas/ventas.routes')
            },
            {
                path: 'compras',
                loadChildren: () => import('./compras/compras.routes')
            },
            {
                path: '**',
                redirectTo: 'dashboard'
            }
        ]
    }
]


export default routes;