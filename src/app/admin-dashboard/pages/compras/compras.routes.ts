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
import { NotasAjusteComprasComponent } from "./notas-ajuste/notas-ajuste.component";
import { NotasAjusteComprasFormPageComponent } from "./notas-ajuste/notas-ajuste-form-page/notas-ajuste-form-page.component";
import { NotasAjusteComprasDetailsComponent } from "./notas-ajuste/components/notas-ajuste-details/notas-ajuste-details.component";

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
 path: 'articles',
 component: ProductosCompraComponent
 },
 {
 path: 'articles/:id',
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
 // Notas de Ajuste Compras Routes
 {
 path: 'notas-ajuste',
 component: NotasAjusteComprasComponent
 },
 {
 path: 'notas-ajuste/:id',
 component: NotasAjusteComprasFormPageComponent
 },
 {
 path: 'notas-ajuste/:id/details',
 component: NotasAjusteComprasDetailsComponent
 },
 {
 path: '**',
 component: ErrorPageComponent
 }
]

export default comprasRoutes;

