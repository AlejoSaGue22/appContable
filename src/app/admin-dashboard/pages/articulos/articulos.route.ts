import { Routes } from "@angular/router";
import { ErrorPageComponent } from "@utils/components/error-page/error-page.component";
import { ProductosServiciosComponent } from "./productos-servicios.component";
import { ProductosServiciosFormsComponent } from "./productos-servicios-forms/productos-servicios-forms.component";

export const articulosRoutes: Routes = [
    {
        path: '',
        component: ProductosServiciosComponent
    },
    {
        path: ':id',
        component: ProductosServiciosFormsComponent
    },
    {
        path: '**',
        component: ErrorPageComponent
    }
]

export default articulosRoutes;

