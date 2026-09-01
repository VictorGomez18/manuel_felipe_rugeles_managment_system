export type AppRole = 'admin' | 'director' | 'cashier' | 'teacher'

export type AppPermission =
  | 'dashboard.view'
  | 'students.view'
  | 'students.create'
  | 'guardians.view'
  | 'guardians.create'
  | 'guardians.update'
  | 'classrooms.view'
  | 'classrooms.manage'
  | 'tuition.view'
  | 'tuition.generate'
  | 'receivables.view'
  | 'payments.view'
  | 'payments.create'
  | 'payments.void'
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.manage_categories'
  | 'employees.view'
  | 'employees.manage'
  | 'payroll.view'
  | 'payroll.manage'
  | 'reports.view'
  | 'settings.view'
  | 'settings.update'
  | 'audit.view'

const rolePermissions: Record<AppRole, Set<AppPermission>> = {
  admin: new Set<AppPermission>([
    'dashboard.view',
    'students.view',
    'students.create',
    'guardians.view',
    'guardians.create',
    'guardians.update',
    'classrooms.view',
    'classrooms.manage',
    'tuition.view',
    'tuition.generate',
    'receivables.view',
    'payments.view',
    'payments.create',
    'payments.void',
    'expenses.view',
    'expenses.create',
    'expenses.manage_categories',
    'employees.view',
    'employees.manage',
    'payroll.view',
    'payroll.manage',
    'reports.view',
    'settings.view',
    'settings.update',
    'audit.view',
  ]),
  director: new Set<AppPermission>([
    'dashboard.view',
    'students.view',
    'students.create',
    'guardians.view',
    'guardians.create',
    'guardians.update',
    'classrooms.view',
    'classrooms.manage',
    'tuition.view',
    'tuition.generate',
    'receivables.view',
    'payments.view',
    'payments.create',
    'payments.void',
    'expenses.view',
    'expenses.create',
    'expenses.manage_categories',
    'employees.view',
    'employees.manage',
    'payroll.view',
    'payroll.manage',
    'reports.view',
    'settings.view',
    'settings.update',
    'audit.view',
  ]),
  cashier: new Set<AppPermission>([
    'dashboard.view',
    'students.view',
    'students.create',
    'guardians.view',
    'guardians.create',
    'guardians.update',
    'classrooms.view',
    'tuition.view',
    'receivables.view',
    'payments.view',
    'payments.create',
    'payments.void',
    'expenses.view',
    'expenses.create',
    'reports.view',
  ]),
  teacher: new Set<AppPermission>([
    'dashboard.view',
    'students.view',
    'guardians.view',
    'classrooms.view',
    'tuition.view',
  ]),
}

export const hasPermission = (role: AppRole | null | undefined, permission: AppPermission) => {
  if (!role) return false
  return rolePermissions[role].has(permission)
}
