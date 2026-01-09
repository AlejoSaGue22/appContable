import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuPerfilComponent } from "../../components/menu-perfil/menu-perfil.component";
import { BarralateralMenuComponent } from "@dashboard/components/barralateral-menu/barralateral-menu.component";
import { OptionBarralateral } from "@dashboard/components/option-barralateral/option-barralateral.component";
import { FlowbiteService } from 'src/app/utils/services/flowbite.service';
import { Subscription } from 'rxjs';
import { Permission } from '@dashboard/interfaces/permission-interface';

export interface MenuOption {
  name: string
  route: string
  icon: string
}

export interface Sidebar {
  name: string;
  icon: string;
  route?: string;
  defaultOpen?: boolean;
  permission?: Permission | Permission[]; // Permiso(s) requerido(s)
  subItems?: Sidebar[];
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

@Component({
  selector: 'app-admin-layouts',
  imports: [RouterOutlet, MenuPerfilComponent, BarralateralMenuComponent, OptionBarralateral],
  templateUrl: './admin-layouts.component.html',
})
export default class AdminLayoutsComponent implements OnInit, OnDestroy{

  activeMenu: string | null = 'Dashboard';
  private routeSubscription: Subscription | null = null;
  router = inject(Router);

  ngOnInit(): void {
    this.routeSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setActiveMenuBasedOnRoute();
      }
    });

    this.setActiveMenuBasedOnRoute();
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }


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
        route: '/dashboard/index',
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
  ];

  setActiveMenuBasedOnRoute() {
    const currentRoute = this.router.url.split('?')[0];  // Remove query params
    const currentRoute2 = this.router.url.includes('new-Item') ? this.router.url.split('/') : [];  // Remove params
    currentRoute2.pop();

    for (const sidebar of this.menuLateral) {
      const matchingItem = sidebar.subItems?.find(item => item.route === currentRoute || item.route === currentRoute2.join("/") );

      if (matchingItem) {
        this.activeMenu = sidebar.name;
        break;
      }
    }
  }



}
