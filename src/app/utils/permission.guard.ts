// src/app/core/guards/permission.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Permission, UserRole } from '@dashboard/interfaces/permission-interface';

// Mapeo de permisos por rol (igual que en el backend)
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ADMIN]: [
    Permission.INVOICE_CREATE, Permission.INVOICE_READ, Permission.INVOICE_UPDATE, Permission.INVOICE_EXPORT,
    Permission.CLIENT_CREATE, Permission.CLIENT_READ, Permission.CLIENT_UPDATE, Permission.CLIENT_DELETE,
    Permission.PRODUCT_CREATE, Permission.PRODUCT_READ, Permission.PRODUCT_UPDATE, Permission.PRODUCT_DELETE,
    Permission.REPORT_READ, Permission.REPORT_EXPORT,
    Permission.USER_MANAGE
  ],
  [UserRole.MANAGER]: [
    Permission.INVOICE_CREATE, Permission.INVOICE_READ, Permission.INVOICE_UPDATE, Permission.INVOICE_EXPORT,
    Permission.CLIENT_CREATE, Permission.CLIENT_READ, Permission.CLIENT_UPDATE,
    Permission.PRODUCT_READ, Permission.PRODUCT_UPDATE,
    Permission.REPORT_READ, Permission.REPORT_EXPORT
  ],
  [UserRole.ACCOUNTANT]: [
    Permission.INVOICE_READ, Permission.INVOICE_EXPORT,
    Permission.CLIENT_READ,
    Permission.PRODUCT_READ,
    Permission.REPORT_READ, Permission.REPORT_EXPORT
  ],
  [UserRole.SALES]: [
    Permission.INVOICE_CREATE, Permission.INVOICE_READ,
    Permission.CLIENT_CREATE, Permission.CLIENT_READ,
    Permission.PRODUCT_READ
  ],
  [UserRole.VIEWER]: [
    Permission.INVOICE_READ,
    Permission.CLIENT_READ,
    Permission.PRODUCT_READ,
    Permission.REPORT_READ
  ]
};

export const permissionGuard = (requiredPermissions: Permission[]): CanActivateFn => {
  return (route, state) => {
    const router = inject(Router);
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.navigate(['/login']);
      return false;
    }

    const user = JSON.parse(userStr);
    const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || [];

    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
};

// Helper para verificar permisos en componentes
export function hasPermission(permission: Permission): boolean {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;

  const user = JSON.parse(userStr);
  const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
  
  return userPermissions.includes(permission);
}