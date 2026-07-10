import { Routes } from "@angular/router";
import { ConfiguracionMenuComponent } from "./configuracion-menu/configuracion-menu.component";
import { EmpresaComponent } from "./pages/empresa/empresa.component";
import { ImpuestosComponent } from "./pages/impuestos/impuestos.component";
import { VendedoresComponent } from "./pages/vendedores/vendedores.component";
import { ParametrizacionContable } from "./pages/parametrizacion-contable/parametrizacion-contable";
import { CargosComponent } from "./pages/cargos/cargos.component";
import { CentrosCostosComponent } from "./pages/centros-costos/centros-costos.component";
import { TipoComprobantesComponent } from "./pages/tipo-comprobantes/tipo-comprobantes.component";

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
 path: 'cargos',
 component: CargosComponent
 },
 {
 path: 'centros-costos',
 component: CentrosCostosComponent
 },
 {
 path: 'tipos-comprobantes',
 component: TipoComprobantesComponent
 },
 {
 path: '**',
 redirectTo: ''
 }
];

export default configuracionesRoutes;
