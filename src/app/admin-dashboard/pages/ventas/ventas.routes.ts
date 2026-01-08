import { Routes } from "@angular/router";
import { ClientsPageComponent } from "./clientes/clients-page.component";
import { ClientsFormPageComponent } from "./clientes/clients-form-page/clients-form-page.component";
import { ComprobanteVentasComponent } from "./comprobante-ventas/comprobante-ventas.component";
import { ComprobanteVentasFormsPageComponent } from "./comprobante-ventas/comprobante-ventas-forms-page/comprobante-ventas-forms-page.component";
import { ProductosServiciosComponent } from "./productos-servicios/productos-servicios.component";
import { ProductosServiciosFormsComponent } from "./productos-servicios/productos-servicios-forms/productos-servicios-forms.component";
import { InvoiceDetailsComponent } from "./comprobante-ventas/components/invoice-details/invoice-details.component";


export const ventasRoutes: Routes = [
                    {
                        path: 'clients',
                        component: ClientsPageComponent
                    },
                    {
                        path: 'clients/:id',
                        component: ClientsFormPageComponent
                    },
                    {
                        path: 'comprobantes',
                        component: ComprobanteVentasComponent
                    },
                    {
                        path: 'comprobantes/:id',
                        component: ComprobanteVentasFormsPageComponent
                    },
                    {
                        path: 'comprobantes/:id/details',
                        component: InvoiceDetailsComponent
                    },
                    {
                        path: 'products_services',
                        component: ProductosServiciosComponent
                    },
                    {
                        path: 'products_services/:id',
                        component: ProductosServiciosFormsComponent
                    },
                    {
                        path: '**',
                        redirectTo: 'clients'
                    }
]

export default ventasRoutes;

