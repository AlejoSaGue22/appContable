export enum Permission {
  INVOICE_CREATE = 'invoice:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  INVOICE_EXPORT = 'invoice:export',
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_READ = 'product:read',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  REPORT_READ = 'report:read',
  REPORT_EXPORT = 'report:export',
  PURCHASE_CREATE = 'purchase:create',
  PURCHASE_READ = 'purchase:read',
  PURCHASE_UPDATE = 'purchase:update',
  PURCHASE_DELETE = 'purchase:delete',
  PURCHASE_EXPORT = 'purchase:export',
  PROVIDER_CREATE = 'provider:create',
  PROVIDER_READ = 'provider:read',
  PROVIDER_UPDATE = 'provider:update',
  PROVIDER_DELETE = 'provider:delete',
  PROVIDER_EXPORT = 'provider:export',
  USER_MANAGE = 'user:manage',
  ROLE_MANAGE = 'role:manage',
  SETTINGS_MANAGE = 'settings:manage'
}


export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  SALES = 'sales',
  VIEWER = 'viewer'
}