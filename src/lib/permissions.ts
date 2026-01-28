// Role-Based Access Control (RBAC) System

export enum Permission {
  // Client Permissions
  VIEW_CLIENTS = 'view_clients',
  CREATE_CLIENTS = 'create_clients',
  EDIT_CLIENTS = 'edit_clients',
  DELETE_CLIENTS = 'delete_clients',
  EXPORT_CLIENTS = 'export_clients',

  // Document Permissions
  VIEW_DOCUMENTS = 'view_documents',
  UPLOAD_DOCUMENTS = 'upload_documents',
  EDIT_DOCUMENTS = 'edit_documents',
  DELETE_DOCUMENTS = 'delete_documents',
  SHARE_DOCUMENTS = 'share_documents',
  SIGN_DOCUMENTS = 'sign_documents',

  // Bookkeeping Permissions
  VIEW_TRANSACTIONS = 'view_transactions',
  CREATE_TRANSACTIONS = 'create_transactions',
  EDIT_TRANSACTIONS = 'edit_transactions',
  DELETE_TRANSACTIONS = 'delete_transactions',
  RECONCILE_ACCOUNTS = 'reconcile_accounts',
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',

  // Tax Permissions
  VIEW_TAX_RETURNS = 'view_tax_returns',
  CREATE_TAX_RETURNS = 'create_tax_returns',
  EDIT_TAX_RETURNS = 'edit_tax_returns',
  FILE_TAX_RETURNS = 'file_tax_returns',
  VIEW_TAX_RESEARCH = 'view_tax_research',

  // Payroll Permissions
  VIEW_PAYROLL = 'view_payroll',
  CREATE_PAYROLL = 'create_payroll',
  EDIT_PAYROLL = 'edit_payroll',
  APPROVE_PAYROLL = 'approve_payroll',
  PROCESS_PAYROLL = 'process_payroll',

  // Practice Management
  VIEW_INVOICES = 'view_invoices',
  CREATE_INVOICES = 'create_invoices',
  EDIT_INVOICES = 'edit_invoices',
  DELETE_INVOICES = 'delete_invoices',
  SEND_INVOICES = 'send_invoices',
  VIEW_TIME_ENTRIES = 'view_time_entries',
  CREATE_TIME_ENTRIES = 'create_time_entries',
  APPROVE_TIME_ENTRIES = 'approve_time_entries',

  // AI Features
  USE_AI_CATEGORIZATION = 'use_ai_categorization',
  USE_AI_ANALYSIS = 'use_ai_analysis',
  USE_AI_TAX_RESEARCH = 'use_ai_tax_research',

  // Admin Permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_INTEGRATIONS = 'manage_integrations',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_TEMPLATES = 'manage_templates',
}

export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: Object.values(Permission), // All permissions

  PARTNER: [
    // Client
    Permission.VIEW_CLIENTS,
    Permission.CREATE_CLIENTS,
    Permission.EDIT_CLIENTS,
    Permission.EXPORT_CLIENTS,

    // Documents
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.EDIT_DOCUMENTS,
    Permission.SHARE_DOCUMENTS,
    Permission.SIGN_DOCUMENTS,

    // Bookkeeping
    Permission.VIEW_TRANSACTIONS,
    Permission.CREATE_TRANSACTIONS,
    Permission.EDIT_TRANSACTIONS,
    Permission.RECONCILE_ACCOUNTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,

    // Tax
    Permission.VIEW_TAX_RETURNS,
    Permission.CREATE_TAX_RETURNS,
    Permission.EDIT_TAX_RETURNS,
    Permission.FILE_TAX_RETURNS,
    Permission.VIEW_TAX_RESEARCH,

    // Payroll
    Permission.VIEW_PAYROLL,
    Permission.CREATE_PAYROLL,
    Permission.EDIT_PAYROLL,
    Permission.APPROVE_PAYROLL,
    Permission.PROCESS_PAYROLL,

    // Practice
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICES,
    Permission.EDIT_INVOICES,
    Permission.SEND_INVOICES,
    Permission.VIEW_TIME_ENTRIES,
    Permission.CREATE_TIME_ENTRIES,
    Permission.APPROVE_TIME_ENTRIES,

    // AI
    Permission.USE_AI_CATEGORIZATION,
    Permission.USE_AI_ANALYSIS,
    Permission.USE_AI_TAX_RESEARCH,

    // Admin
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_INTEGRATIONS,
    Permission.VIEW_AUDIT_LOGS,
  ],

  MANAGER: [
    // Client
    Permission.VIEW_CLIENTS,
    Permission.CREATE_CLIENTS,
    Permission.EDIT_CLIENTS,

    // Documents
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.EDIT_DOCUMENTS,
    Permission.SHARE_DOCUMENTS,

    // Bookkeeping
    Permission.VIEW_TRANSACTIONS,
    Permission.CREATE_TRANSACTIONS,
    Permission.EDIT_TRANSACTIONS,
    Permission.RECONCILE_ACCOUNTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,

    // Tax
    Permission.VIEW_TAX_RETURNS,
    Permission.CREATE_TAX_RETURNS,
    Permission.EDIT_TAX_RETURNS,
    Permission.VIEW_TAX_RESEARCH,

    // Payroll
    Permission.VIEW_PAYROLL,
    Permission.CREATE_PAYROLL,
    Permission.EDIT_PAYROLL,
    Permission.APPROVE_PAYROLL,

    // Practice
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICES,
    Permission.EDIT_INVOICES,
    Permission.VIEW_TIME_ENTRIES,
    Permission.CREATE_TIME_ENTRIES,
    Permission.APPROVE_TIME_ENTRIES,

    // AI
    Permission.USE_AI_CATEGORIZATION,
    Permission.USE_AI_ANALYSIS,
    Permission.USE_AI_TAX_RESEARCH,
  ],

  STAFF: [
    // Client
    Permission.VIEW_CLIENTS,

    // Documents
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,

    // Bookkeeping
    Permission.VIEW_TRANSACTIONS,
    Permission.CREATE_TRANSACTIONS,
    Permission.VIEW_REPORTS,

    // Tax
    Permission.VIEW_TAX_RETURNS,
    Permission.EDIT_TAX_RETURNS,

    // Payroll
    Permission.VIEW_PAYROLL,

    // Practice
    Permission.VIEW_INVOICES,
    Permission.VIEW_TIME_ENTRIES,
    Permission.CREATE_TIME_ENTRIES,

    // AI
    Permission.USE_AI_CATEGORIZATION,
    Permission.USE_AI_ANALYSIS,
  ],

  CLIENT: [
    // Documents (own only)
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,

    // View own data
    Permission.VIEW_TRANSACTIONS,
    Permission.VIEW_TAX_RETURNS,
    Permission.VIEW_PAYROLL,
    Permission.VIEW_INVOICES,
  ],
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = RolePermissions[userRole] || []
  return permissions.includes(permission)
}

export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

export function canAccessResource(
  userRole: string,
  userId: string,
  resourceOwnerId: string,
  permission: Permission
): boolean {
  // Admins and Partners can access all resources
  if (userRole === 'ADMIN' || userRole === 'PARTNER') {
    return hasPermission(userRole, permission)
  }

  // Others can only access their own resources
  return userId === resourceOwnerId && hasPermission(userRole, permission)
}

export function getPermissionsForRole(role: string): Permission[] {
  return RolePermissions[role] || []
}
