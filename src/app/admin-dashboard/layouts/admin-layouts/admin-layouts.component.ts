import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuPerfilComponent } from "../../components/menu-perfil/menu-perfil.component";
import { BarralateralMenuComponent } from "@dashboard/components/barralateral-menu/barralateral-menu.component";
import { OptionBarralateral } from "@dashboard/components/option-barralateral/option-barralateral.component";
import { FlowbiteService } from 'src/app/utils/services/flowbite.service';
import { filter, Subscription } from 'rxjs';
import { Permission } from '@dashboard/interfaces/permission-interface';
import { MenuService } from '@utils/services/menu.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { MenuItem } from '@utils/menu.config';

export interface MenuOption {
  name: string
  route: string
  icon: string
}

// export interface Sidebar {
//   title: string;
//   icon: string;
//   route?: string;
//   defaultOpen?: boolean;
//   permission?: Permission | Permission[]; // Permiso(s) requerido(s)
//   subItems?: Sidebar[];
//   badge?: string;
//   badgeColor?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
// }

@Component({
  selector: 'app-admin-layouts',
  imports: [RouterOutlet, MenuPerfilComponent, BarralateralMenuComponent, OptionBarralateral],
  templateUrl: './admin-layouts.component.html',
})
export default class AdminLayoutsComponent implements OnInit, OnDestroy{

  private menuService = inject(MenuService);
  private authService = inject(AuthService);
  private router = inject(Router);

  activeMenu: string | null = 'Dashboard';
  private routeSubscription: Subscription | null = null;
  menuItems = this.menuService.menuItems();
  isLoading = this.menuService.isLoading();
  currentUser = this.authService.user();

  // Estado local
  expandedPanels = signal<Set<string>>(new Set());
  activeRoute = signal<string>('');


  ngOnInit(): void {
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeRoute.set(event.url);
        this.updateExpandedPanels(event.url);
      });

    
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
  
  menuLateral = computed(() => {
    return this.menuItems;
  });
  
  // menuLateral: Sidebar[] = [
  //     {
  //       title: 'Dashboard',
  //       icon: '<i class="fa-solid fa-chart-simple"></i>',
  //       route: '/dashboard/index',
  //     },
  //     {
  //       title: 'Ventas',
  //       icon: '<i class="fa-solid fa-hand-holding-dollar"></i>',
  //       subItems: [
  //           {
  //             title: 'Clientes',
  //             route: '/dashboard/ventas/clients',
  //             icon: 'fa-solid fa-users'
  //           },
  //           {
  //             title: 'Comprobante de venta',
  //             route: '/dashboard/ventas/comprobantes',
  //             icon: 'fa-solid fa-users'
  //           },
  //           {
  //             title: 'Productos y Servicios',
  //             route: '/dashboard/ventas/products_services',
  //             icon: 'fa-solid fa-users'
  //           }
  //       ]
  //     },
  //     {
  //       title: 'Compras y gastos',
  //       icon: '<i class="fa-solid fa-money-bill-1-wave"></i>',
  //       subItems: [
  //           {
  //             title: 'Comprobantes de compra',
  //             route: '/dashboard/compra',
  //             icon: 'fa-solid fa-users'
  //           },
  //           {
  //             title: 'Proveedores',
  //             route: '/dashboard/proveedor',
  //             icon: 'fa-solid fa-warehouse'
  //           }
  //       ]
  //     }
  // ];

  private updateExpandedPanels(currentUrl: string): void {
    const newExpanded = new Set<string>();
    
    const findAndExpandParent = (items: MenuItem[], url: string): boolean => {
      for (const item of items) {
        if (item.children) {
          for (const child of item.children) {
            if (child.route === url || url.startsWith(child.route + '/')) {
              newExpanded.add(item.id);
              return true;
            }
          }
          if (findAndExpandParent(item.children, url)) {
            newExpanded.add(item.id);
            return true;
          }
        }
      }
      return false;
    };
    
    findAndExpandParent(this.menuItems, currentUrl);
    this.expandedPanels.set(newExpanded);
  }

  isPanelExpanded(panelId: string): boolean {
    return this.expandedPanels().has(panelId);
  }

  isItemActive(item: MenuItem): boolean {
    if (item.children) {
      return item.children.some(child => 
        this.activeRoute() === child.route || 
        this.activeRoute().startsWith(child.route + '/')
      );
    }
    return this.activeRoute() === item.route;
  }

  

}


















