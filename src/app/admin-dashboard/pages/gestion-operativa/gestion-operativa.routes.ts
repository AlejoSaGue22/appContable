import { Routes } from "@angular/router";
import { ErrorPageComponent } from "@utils/components/error-page/error-page.component";
import { PrescripcionesComponent } from "./prescripciones/prescripciones.component";
import { PrescripcionFormComponent } from "./prescripciones/components/prescripciones-form-page/prescripcion-form.component";
import { PrescripcionDetailsComponent } from "./prescripciones/components/prescripciones-details/prescripcion-details.component";

export const gestionOperativaRoutes: Routes = [
    {
        path: 'prescripciones',
        component: PrescripcionesComponent
    },
    {
        path: 'prescripciones/new-prescription',
        component: PrescripcionFormComponent
    },
    {
        path: 'prescripciones/:id/details',
        component: PrescripcionDetailsComponent
    },
    {
        path: 'prescripciones/:id',
        component: PrescripcionFormComponent
    },
    {
        path: '**',
        component: ErrorPageComponent
    }
]

export default gestionOperativaRoutes;

