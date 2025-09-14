import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuPerfilComponent } from "../../components/menu-perfil/menu-perfil.component";
import { BarralateralMenuComponent } from "@dashboard/components/barralateral-menu/barralateral-menu.component";

export interface MenuOption {
  name: string
  route: string
  icon: string
}

interface Sidebar {
  name: string;
  icon: string;
  defaultOpen?: boolean;
  subItems: MenuOption[];
}

@Component({
  selector: 'app-admin-layouts',
  imports: [RouterOutlet, MenuPerfilComponent, BarralateralMenuComponent],
  templateUrl: './admin-layouts.component.html',
})
export default class AdminLayoutsComponent {

  activeMenu: string | null = 'Dashboard';

  toggleActiveMenu(menuId: string){
    if (this.activeMenu === menuId) {
      this.activeMenu = null; 
    } else {
      this.activeMenu = menuId; 
    }
  }
  
  menuLateral: Sidebar[] = [
      {
        name: 'Dashboard',
        icon: '<i class="fa-solid fa-chart-simple"></i>',
        subItems: [
            {
              name: 'Indice',
              route: '/dashboard/index',
              icon: 'fa-solid fa-layer-group'
            }
        ]
      },
      {
        name: 'Ventas',
        icon: '<i class="fa-solid fa-hand-holding-dollar"></i>',
        subItems: [
            {
              name: 'Clientes',
              route: '/dashboard/ventas/clients',
              icon: 'fa-solid fa-users'
            },
            {
              name: 'Comprobante de venta',
              route: '/dashboard/ventas/comprobantes',
              icon: 'fa-solid fa-users'
            },
            {
              name: 'Productos y Servicios',
              route: '/dashboard/ventas/products_services',
              icon: 'fa-solid fa-users'
            }
        ]
      },
      {
        name: 'Compras y gastos',
        icon: '<i class="fa-solid fa-money-bill-1-wave"></i>',
        subItems: [
            {
              name: 'Comprobastes de compra',
              route: '/dashboard/compra',
              icon: 'fa-solid fa-users'
            },
            {
              name: 'Proveedores',
              route: '/dashboard/proveedor',
              icon: 'fa-solid fa-warehouse'
            }
        ]
      }
  ]





 }
