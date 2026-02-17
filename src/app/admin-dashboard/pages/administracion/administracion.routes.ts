import { Routes } from "@angular/router";
import { ErrorPageComponent } from "@utils/components/error-page/error-page.component";
import { UsersComponent } from "./users/users/users.component";
import { UserFormsPageComponent } from "./users/users-forms-page/user-forms-page.component";

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
        path: '**',
        component: ErrorPageComponent
    }
];

export default administracionRoutes;