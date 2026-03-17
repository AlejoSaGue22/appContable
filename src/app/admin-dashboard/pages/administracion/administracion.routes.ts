import { Routes } from "@angular/router";
import { ErrorPageComponent } from "@utils/components/error-page/error-page.component";
import { UsersComponent } from "./users/users/users.component";
import { UserFormsPageComponent } from "./users/users-forms-page/user-forms-page.component";
import { RolesComponent } from "./roles/roles.component";

export const administracionRoutes: Routes = [
    {
        path: 'users',
        component: UsersComponent
    },
    {
        path: 'users/:id',
        component: UserFormsPageComponent
    },
    {
        path: 'menu',
        loadChildren: () => import('./menu/menu.routes')
    },
    {
        path: 'roles',
        component: RolesComponent
    },
    {
        path: '**',
        component: ErrorPageComponent
    }
];

export default administracionRoutes;