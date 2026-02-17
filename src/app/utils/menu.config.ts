// src/app/core/config/menu.config.ts
// Configuración centralizada de menús con permisos

import { Permission } from "@dashboard/interfaces/permission-interface";

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  requiredPermission: Permission;
  other?: string;
  order?: number;
  children?: MenuItem[];
  isActive: boolean;
  badge?: {
    count: number;
    color: 'primary' | 'accent' | 'warn';
  };
}

export interface MenuResponse {
  success: boolean;
  data: MenuItem[];
  message?: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'admin',
    title: 'Administración',
    icon: 'settings', // Assuming a standard icon name or SVG
    route: '/panel/admin',
    requiredPermission: 'ADMIN_ACCESS' as Permission,
    isActive: true,
    children: [
      {
        id: 'users',
        title: 'Usuarios',
        icon: 'users',
        route: '/panel/admin/users',
        requiredPermission: 'USER_READ' as Permission,
        isActive: true,
      }
    ]
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Filtra los menús según los permisos del usuario
 */
// export function filterMenusByPermissions(
//   menuItems: MenuItem[],
//   userPermissions: Permission[]
// ): MenuItem[] {
//   return menuItems.filter(item => {
//     // Si no requiere permiso, siempre es visible
//     if (!item.requiredPermission) return true;

//     // Si requiere un permiso
//     if (typeof item.requiredPermission === 'string') {
//       const hasPermission = userPermissions.includes(item.requiredPermission);
      
//       // Si tiene hijos, filtrarlos también
//       if (hasPermission && item.children) {
//         item.children = filterMenusByPermissions(item.children, userPermissions);
//       }
      
//       return hasPermission;
//     }

//     // Si requiere múltiples permisos (OR - cualquiera)
//     if (Array.isArray(item.requiredPermission)) {
//       const hasAnyPermission = item.requiredPermission.some(perm => 
//         userPermissions.includes(perm)
//       );
      
//       if (hasAnyPermission && item.children) {
//         item.children = filterMenusByPermissions(item.children, userPermissions);
//       }
      
//       return hasAnyPermission;
//     }

//     return false;
//   });
// }

/**
 * Obtiene menús visibles para un rol específico
 */
// export function getMenusForRole(role: string, rolePermissions: Record<string, Permission[]>): MenuItem[] {
//   const userPermissions = rolePermissions[role] || [];
//   return filterMenusByPermissions(MENU_ITEMS, userPermissions);
// }