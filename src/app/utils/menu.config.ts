// src/app/core/config/menu.config.ts
// Configuración centralizada de menús con permisos

import { Permission } from "@dashboard/interfaces/permission-interface";


export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  permission?: Permission | Permission[]; // Permiso(s) requerido(s)
  children?: MenuItem[];
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

// 📋 CONFIGURACIÓN COMPLETA DE MENÚS
export const MENU_ITEMS: MenuItem[] = [
  // ============================================
  // DASHBOARD
  // ============================================
  {
    label: 'Dashboard',
    icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
    </svg>`,
    route: '/dashboard',
    // Sin permiso = visible para todos los roles autenticados
  },

  // ============================================
  // FACTURAS
  // ============================================
  {
    label: 'Facturas',
    icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
      <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
    </svg>`,
    permission: Permission.INVOICE_READ, // Requiere al menos lectura
    children: [
      {
        label: 'Ver Facturas',
        icon: '📄',
        route: '/facturas',
        permission: Permission.INVOICE_READ,
      },
      {
        label: 'Nueva Factura',
        icon: '➕',
        route: '/facturas/crear',
        permission: Permission.INVOICE_CREATE,
        badge: 'Nuevo',
        badgeColor: 'green'
      },
      {
        label: 'Borradores',
        icon: '📝',
        route: '/facturas/borradores',
        permission: Permission.INVOICE_CREATE,
      },
      {
        label: 'Exportar',
        icon: '⬇️',
        route: '/facturas/exportar',
        permission: Permission.INVOICE_EXPORT,
      }
    ]
  },

  // ============================================
  // CLIENTES
  // ============================================
  {
    label: 'Clientes',
    icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
    </svg>`,
    permission: Permission.CLIENT_READ,
    children: [
      {
        label: 'Ver Clientes',
        icon: '👥',
        route: '/clientes',
        permission: Permission.CLIENT_READ,
      },
      {
        label: 'Nuevo Cliente',
        icon: '➕',
        route: '/clientes/crear',
        permission: Permission.CLIENT_CREATE,
      }
    ]
  },

  // ============================================
  // PRODUCTOS
  // ============================================
  {
    label: 'Productos',
    icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"/>
    </svg>`,
    permission: Permission.PRODUCT_READ,
    children: [
      {
        label: 'Ver Productos',
        icon: '📦',
        route: '/productos',
        permission: Permission.PRODUCT_READ,
      },
      {
        label: 'Nuevo Producto',
        icon: '➕',
        route: '/productos/crear',
        permission: Permission.PRODUCT_CREATE,
      },
      {
        label: 'Inventario',
        icon: '📊',
        route: '/productos/inventario',
        permission: Permission.PRODUCT_READ,
      }
    ]
  },

  // ============================================
  // REPORTES
  // ============================================
  {
    label: 'Reportes',
    icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
    </svg>`,
    permission: Permission.REPORT_READ,
    children: [
      {
        label: 'Ventas',
        icon: '💰',
        route: '/reportes/ventas',
        permission: Permission.REPORT_READ,
      },
      {
        label: 'Clientes',
        icon: '👥',
        route: '/reportes/clientes',
        permission: Permission.REPORT_READ,
      },
      {
        label: 'Productos',
        icon: '📦',
        route: '/reportes/productos',
        permission: Permission.REPORT_READ,
      },
      {
        label: 'Exportar',
        icon: '⬇️',
        route: '/reportes/exportar',
        permission: Permission.REPORT_EXPORT,
      }
    ]
  },

  // ============================================
  // ADMINISTRACIÓN
  // ============================================
  {
    label: 'Administración',
    icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
    </svg>`,
    permission: [Permission.USER_MANAGE, Permission.SETTINGS_MANAGE], // Cualquiera de los dos
    children: [
      {
        label: 'Usuarios',
        icon: '👤',
        route: '/admin/usuarios',
        permission: Permission.USER_MANAGE,
      },
      {
        label: 'Roles y Permisos',
        icon: '🔐',
        route: '/admin/roles',
        permission: Permission.ROLE_MANAGE,
      },
      {
        label: 'Configuración',
        icon: '⚙️',
        route: '/admin/configuracion',
        permission: Permission.SETTINGS_MANAGE,
      }
    ]
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Filtra los menús según los permisos del usuario
 */
export function filterMenusByPermissions(
  menuItems: MenuItem[],
  userPermissions: Permission[]
): MenuItem[] {
  return menuItems.filter(item => {
    // Si no requiere permiso, siempre es visible
    if (!item.permission) return true;

    // Si requiere un permiso
    if (typeof item.permission === 'string') {
      const hasPermission = userPermissions.includes(item.permission);
      
      // Si tiene hijos, filtrarlos también
      if (hasPermission && item.children) {
        item.children = filterMenusByPermissions(item.children, userPermissions);
      }
      
      return hasPermission;
    }

    // Si requiere múltiples permisos (OR - cualquiera)
    if (Array.isArray(item.permission)) {
      const hasAnyPermission = item.permission.some(perm => 
        userPermissions.includes(perm)
      );
      
      if (hasAnyPermission && item.children) {
        item.children = filterMenusByPermissions(item.children, userPermissions);
      }
      
      return hasAnyPermission;
    }

    return false;
  });
}

/**
 * Obtiene menús visibles para un rol específico
 */
export function getMenusForRole(role: string, rolePermissions: Record<string, Permission[]>): MenuItem[] {
  const userPermissions = rolePermissions[role] || [];
  return filterMenusByPermissions(MENU_ITEMS, userPermissions);
}