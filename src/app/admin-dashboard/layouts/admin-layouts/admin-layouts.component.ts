import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuPerfilComponent } from "../../components/menu-perfil/menu-perfil.component";
import { BarralateralMenuComponent } from "@dashboard/components/barralateral-menu/barralateral-menu.component";
import { OptionBarralateral } from "@dashboard/components/option-barralateral/option-barralateral.component";
import { NgClass } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { Permission } from '@dashboard/interfaces/permission-interface';
import { MenuService } from '@utils/services/menu.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { MenuItem } from '@utils/menu.config';
import { LoaderComponent } from "@utils/components/loader/loader.component";
import { LoaderService } from '@utils/services/loader.service';

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
  imports: [RouterOutlet, MenuPerfilComponent, BarralateralMenuComponent, OptionBarralateral, NgClass, LoaderComponent],
  templateUrl: './admin-layouts.component.html',
})
export default class AdminLayoutsComponent implements OnInit, OnDestroy {

  private menuService = inject(MenuService);
  authService = inject(AuthService);
  private router = inject(Router);
  loaderService = inject(LoaderService);

  activeMenu: string | null = 'Dashboard';
  private routeSubscription: Subscription | null = null;
  menuItems = computed(() => this.menuService.menuItems());
  menuItemsOther = computed(() => this.menuService.menuItems().filter(item => item.other === 'SI').sort((a, b) => a.order! - b.order!));
  isLoading = this.menuService.isLoading;
  currentUser = this.authService.user;

  // Estado local
  expandedPanels = signal<Set<string>>(new Set());
  activeRoute = signal<string>('');
  isMobileMenuOpen = signal<boolean>(false);

  ngOnInit(): void {
    if (this.authService.authStatus() === 'authenticated' && this.menuItems().length === 0) {
      this.menuService.fetchMenu().subscribe();
    }

    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeRoute.set(event.url);
        if (event instanceof NavigationEnd) {
          this.setActiveMenuBasedOnRoute();
        }
        this.updateExpandedPanels(event.url);
      });

  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  toggleActiveMenu(menuId: string) {
    if (this.activeMenu === menuId) {
      this.activeMenu = null;
    } else {
      this.activeMenu = menuId;
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

   async cerrarSesion() {
    this.authService.logout();
    await this.router.navigateByUrl("/")
  }

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

    findAndExpandParent(this.menuItems(), currentUrl);
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

  setActiveMenuBasedOnRoute() {
    const currentRoute = this.router.url.split('?')[0];  // Remove query params
    
    // Check main menu items
    for (const sidebar of this.menuItems()) {
      if (this.isItemActive(sidebar)) {
        this.activeMenu = sidebar.title;
        return;
      }
    }

    // Check other menu items
    for (const sidebar of this.menuItemsOther()) {
      if (this.isItemActive(sidebar)) {
        this.activeMenu = sidebar.title;
        return;
      }
    }
  }

}


















