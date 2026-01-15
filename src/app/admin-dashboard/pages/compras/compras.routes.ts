import { Routes } from "@angular/router";
import { ErrorPageComponent } from "@utils/components/error-page/error-page.component";
import { ProveedoresComponent } from "./proveedores/proveedores.component";
import { ProveedoresFormsPageComponent } from "./proveedores/proveedores-forms-page/proveedores-forms-page.component";
import { ProveedorDetailsComponent } from "./proveedores/components/proveedor-details/proveedor-details.component";
import { FacturaCompraComponent } from "./factura-compra/factura-compra.component";
import { FacturaCompraFormsPageComponent } from "./factura-compra/factura-compra-forms-page/factura-compra-forms-page.component";
import { CompraDetailsComponent } from "./factura-compra/components/compra-details/compra-details.component";
import { ProductosCompraComponent } from "./productos-compra/productos-compra.component";
import { ProductosCompraFormsComponent } from "./productos-compra/productos-compra-forms/productos-compra-forms.component";

export const comprasRoutes: Routes = [
    
                    // Proveedores Routes
                    {
                        path: 'proveedores',
                        component: ProveedoresComponent
                    },
                    {
                        path: 'proveedores/:id',
                        component: ProveedoresFormsPageComponent
                    },
                    {
                        path: 'proveedores/:id/details',
                        component: ProveedorDetailsComponent
                    },
                     // Productos Compra Routes
                    {
                        path: 'products_purchase',
                        component: ProductosCompraComponent
                    },
                    {
                        path: 'products_purchase/:id',
                        component: ProductosCompraFormsComponent
                    },
                    // Factura Compra Routes
                    {
                        path: 'purchases',
                        component: FacturaCompraComponent
                    },
                    {
                        path: 'purchases/:id',
                        component: FacturaCompraFormsPageComponent
                    },
                    {
                        path: 'purchases/:id/details',
                        component: CompraDetailsComponent
                    },
                    {
                        path: '**',
                        component: ErrorPageComponent
                    }
]

export default comprasRoutes;

