import { Routes } from "@angular/router";
import { ConfiguracionMenuComponent } from "./configuracion-menu/configuracion-menu.component";
import { EmpresaComponent } from "./pages/empresa/empresa.component";
import { ImpuestosComponent } from "./pages/impuestos/impuestos.component";
import { VendedoresComponent } from "./pages/vendedores/vendedores.component";
import { ParametrizacionContable } from "./pages/parametrizacion-contable/parametrizacion-contable";

const configuracionesRoutes: Routes = [
 {
 path: '',
 component: ConfiguracionMenuComponent
 },
 {
 path: 'empresa',
 component: EmpresaComponent
 },
 {
 path: 'impuestos',
 component: ImpuestosComponent
 },
 {
 path: 'vendedores',
 component: VendedoresComponent
 },
 {
 path: 'parametrizacion-contable',
 component: ParametrizacionContable
 },
 {
 path: '**',
 redirectTo: ''
 }
];

export default configuracionesRoutes;
