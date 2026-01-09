// core/services/menu.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { environment } from 'src/app/environments/environment';
import { MenuItem, MenuResponse } from '@utils/menu.config';
import { Permission } from '@dashboard/interfaces/permission-interface';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from 'src/app/auth/interfaces/auth-response.interface';

const apiUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  constructor() {
    this.authService.authEvents$.subscribe(event => {
      if (event === 'login') this.fetchMenu().subscribe();
      if (event === 'logout') this.menuReset();
    });
  }
  
//   private apiUrl = `${environment.apiUrl}/menu`;
  
  // Signals para estado reactivo
  private menuItemsSignal = signal<MenuItem[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  
  // Signals computadas
  menuItems = computed(() => this.menuItemsSignal());
  isLoading = computed(() => this.loadingSignal());
  error = computed(() => this.errorSignal());
  
  // Subject para cambios de menú
  private menuChanges = new BehaviorSubject<MenuItem[]>([]);
  menuChanges$ = this.menuChanges.asObservable();
  
  // Mapeo de íconos de Material
  private iconMap: { [key: string]: string } = {
    dashboard: 'dashboard',
    receipt: 'receipt_long',
    people: 'groups',
    inventory: 'inventory_2',
    assessment: 'assessment',
    admin_panel_settings: 'admin_panel_settings',
    list: 'list',
    add: 'add',
    manage_accounts: 'manage_accounts',
    settings: 'settings'
  };

  menuReset(){
    this.menuItemsSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }

  // Obtener menú desde backend
  fetchMenu(): Observable<MenuItem[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    return this.http.get<MenuResponse>(`${apiUrl}/menu`).pipe(
      map(response => {
        if (response.success) {
          const menu = this.transformIcons(response.data);
          this.menuItemsSignal.set(menu);
          this.menuChanges.next(menu);
          return menu;
        }
        throw new Error(response.message || 'Error al cargar el menú');
      }),
      tap({
        next: () => this.loadingSignal.set(false),
        error: (error) => {
          this.loadingSignal.set(false);
          this.errorSignal.set(error.message);
          console.error('Error fetching menu:', error);
        }
      }),
      shareReplay(1)
    );
  }

  // Transformar íconos del backend a Material
  private transformIcons(menuItems: MenuItem[]): MenuItem[] {
    return menuItems.map(item => ({
      ...item,
      icon: this.iconMap[item.icon] || item.icon,
      children: item.children ? this.transformIcons(item.children) : undefined
    }));
  }

  // Filtrar menú basado en permisos locales (fallback)
  filterMenuByPermissions(permissions: Permission[]): MenuItem[] {
    const filterMenu = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter(item => permissions.includes(item.requiredPermission))
        .map(item => ({
          ...item,
          children: item.children ? filterMenu(item.children) : undefined
        }));
    };
    
    return filterMenu(this.menuItemsSignal());
  }

  // Obtener ítem de menú por ruta
  getMenuItemByRoute(route: string): MenuItem | null {
    const findInMenu = (items: MenuItem[]): MenuItem | null => {
      for (const item of items) {
        if (item.route === route) return item;
        if (item.children) {
          const found = findInMenu(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findInMenu(this.menuItemsSignal());
  }

  // Actualizar estado de un ítem del menú (admin only)
  updateMenuItemStatus(menuId: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${apiUrl}/menu/${menuId}`, { isActive }).pipe(
      tap(() => {
        // Actualizar localmente
        const updateItem = (items: MenuItem[]): MenuItem[] => {
          return items.map(item => ({
            ...item,
            isActive: item.id === menuId ? isActive : item.isActive,
            children: item.children ? updateItem(item.children) : undefined
          }));
        };
        
        const updatedMenu = updateItem(this.menuItemsSignal());
        this.menuItemsSignal.set(updatedMenu);
        this.menuChanges.next(updatedMenu);
      })
    );
  }

  // Verificar si usuario tiene acceso a una ruta
  hasAccessToRoute(route: string): boolean {
    const token = sessionStorage.getItem('token');
    if (!token) return false;

    const decoded = jwtDecode<JwtPayload>(token);
    const user = decoded;

    if (!user) return false;
    
    const menuItem = this.getMenuItemByRoute(route);
    console.log("Menu Item: " ,menuItem);
    console.log("User Decoded: " ,user);
    
    if (!menuItem) return false;
    
    return user.permissions.includes(menuItem.requiredPermission);
  }

  // Obtener breadcrumb para ruta actual
  getBreadcrumbForRoute(route: string): { title: string; route: string }[] {
    const breadcrumb: { title: string; route: string }[] = [];
    
    const findPath = (items: MenuItem[], path: string): boolean => {
      for (const item of items) {
        if (item.route === path) {
          breadcrumb.unshift({ title: item.title, route: item.route });
          return true;
        }
        
        if (item.children) {
          if (findPath(item.children, path)) {
            breadcrumb.unshift({ title: item.title, route: item.route });
            return true;
          }
        }
      }
      return false;
    };
    
    findPath(this.menuItemsSignal(), route);
    return breadcrumb;
  }

  // Refrescar menú
  refreshMenu(): void {
    this.fetchMenu().subscribe();
  }
}