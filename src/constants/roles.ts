/**
 * Role Constants and Permissions
 * Defines all user roles and their associated permissions
 */

export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  BUSINESS_ADMIN = 'business-admin',
  HR_ADMIN = 'hr-admin',
  DEPARTMENT_HEAD = 'department-head',
  CONTROL_ROOM = 'control-room',
  STAFF = 'staff',
}

export enum Permission {
  // Business permissions
  VIEW_ALL_BUSINESSES = 'view:all-businesses',
  SWITCH_BUSINESS = 'switch:business',
  CREATE_BUSINESS = 'create:business',
  EDIT_BUSINESS = 'edit:business',
  DELETE_BUSINESS = 'delete:business',

  // Staff permissions
  VIEW_ALL_STAFF = 'view:all-staff',
  VIEW_DEPARTMENT_STAFF = 'view:department-staff',
  VIEW_OWN_STAFF = 'view:own-staff',
  CREATE_STAFF = 'create:staff',
  EDIT_STAFF = 'edit:staff',
  DELETE_STAFF = 'delete:staff',

  // Leave permissions
  VIEW_ALL_LEAVES = 'view:all-leaves',
  VIEW_DEPARTMENT_LEAVES = 'view:department-leaves',
  VIEW_OWN_LEAVES = 'view:own-leaves',
  APPLY_LEAVE = 'apply:leave',
  APPROVE_LEAVE_LEVEL_1 = 'approve:leave-level-1', // Department Head
  APPROVE_LEAVE_LEVEL_2 = 'approve:leave-level-2', // HR Admin
  REJECT_LEAVE = 'reject:leave',
  CANCEL_LEAVE = 'cancel:leave',

  // Attendance permissions
  VIEW_ALL_ATTENDANCE = 'view:all-attendance',
  VIEW_DEPARTMENT_ATTENDANCE = 'view:department-attendance',
  VIEW_OWN_ATTENDANCE = 'view:own-attendance',
  EDIT_ATTENDANCE = 'edit:attendance',
  DELETE_ATTENDANCE = 'delete:attendance',
  CHECK_IN = 'checkin:attendance',
  CHECK_OUT = 'checkout:attendance',

  // Geo tracking permissions
  VIEW_ALL_LOCATIONS = 'view:all-locations',
  VIEW_DEPARTMENT_LOCATIONS = 'view:department-locations',
  VIEW_OWN_LOCATIONS = 'view:own-locations',

  // Department permissions
  VIEW_DEPARTMENTS = 'view:departments',
  CREATE_DEPARTMENT = 'create:department',
  EDIT_DEPARTMENT = 'edit:department',
  DELETE_DEPARTMENT = 'delete:department',

  // Payroll permissions
  VIEW_ALL_PAYROLL = 'view:all-payroll',
  VIEW_OWN_PAYROLL = 'view:own-payroll',
  EDIT_PAYROLL = 'edit:payroll',
  PROCESS_PAYROLL = 'process:payroll',

  // Settings permissions
  VIEW_SETTINGS = 'view:settings',
  EDIT_SETTINGS = 'edit:settings',
}

// Role to Permissions mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // All permissions
    Permission.VIEW_ALL_BUSINESSES,
    Permission.SWITCH_BUSINESS,
    Permission.CREATE_BUSINESS,
    Permission.EDIT_BUSINESS,
    Permission.DELETE_BUSINESS,
    Permission.VIEW_ALL_STAFF,
    Permission.CREATE_STAFF,
    Permission.EDIT_STAFF,
    Permission.DELETE_STAFF,
    Permission.VIEW_ALL_LEAVES,
    Permission.APPROVE_LEAVE_LEVEL_1,
    Permission.APPROVE_LEAVE_LEVEL_2,
    Permission.REJECT_LEAVE,
    Permission.VIEW_ALL_ATTENDANCE,
    Permission.EDIT_ATTENDANCE,
    Permission.DELETE_ATTENDANCE,
    Permission.VIEW_ALL_LOCATIONS,
    Permission.VIEW_DEPARTMENTS,
    Permission.CREATE_DEPARTMENT,
    Permission.EDIT_DEPARTMENT,
    Permission.DELETE_DEPARTMENT,
    Permission.VIEW_ALL_PAYROLL,
    Permission.EDIT_PAYROLL,
    Permission.PROCESS_PAYROLL,
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
  ],

  [UserRole.BUSINESS_ADMIN]: [
    // Business admin has almost all permissions but for their business only
    Permission.VIEW_ALL_STAFF,
    Permission.CREATE_STAFF,
    Permission.EDIT_STAFF,
    Permission.DELETE_STAFF,
    Permission.VIEW_ALL_LEAVES,
    Permission.APPROVE_LEAVE_LEVEL_1,
    Permission.APPROVE_LEAVE_LEVEL_2,
    Permission.REJECT_LEAVE,
    Permission.VIEW_ALL_ATTENDANCE,
    Permission.EDIT_ATTENDANCE,
    Permission.DELETE_ATTENDANCE,
    Permission.VIEW_ALL_LOCATIONS,
    Permission.VIEW_DEPARTMENTS,
    Permission.CREATE_DEPARTMENT,
    Permission.EDIT_DEPARTMENT,
    Permission.DELETE_DEPARTMENT,
    Permission.VIEW_ALL_PAYROLL,
    Permission.EDIT_PAYROLL,
    Permission.PROCESS_PAYROLL,
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
  ],

  [UserRole.HR_ADMIN]: [
    // HR admin - PHASE 2 ENHANCED: Full staff management + payroll
    // Staff management (full CRUD)
    Permission.VIEW_ALL_STAFF,
    Permission.CREATE_STAFF,
    Permission.EDIT_STAFF,
    Permission.DELETE_STAFF,

    // Leave management (Level 2 approval - final approval)
    Permission.VIEW_ALL_LEAVES,
    Permission.APPROVE_LEAVE_LEVEL_2,
    Permission.REJECT_LEAVE,

    // Attendance (view only - cannot edit)
    Permission.VIEW_ALL_ATTENDANCE,

    // Location tracking (view only)
    Permission.VIEW_ALL_LOCATIONS,

    // Payroll management (full access)
    Permission.VIEW_ALL_PAYROLL,
    Permission.EDIT_PAYROLL,
    Permission.PROCESS_PAYROLL,

    // Settings (HR policies section)
    Permission.VIEW_SETTINGS,

    // NOTE: HR cannot manage departments - that's business admin only
    // NOTE: HR cannot edit attendance - escalate to business admin
  ],

  [UserRole.DEPARTMENT_HEAD]: [
    // Department head - department scope, first level approver
    Permission.VIEW_DEPARTMENT_STAFF,
    Permission.VIEW_DEPARTMENT_LEAVES,
    Permission.APPROVE_LEAVE_LEVEL_1,
    Permission.REJECT_LEAVE,
    Permission.VIEW_DEPARTMENT_ATTENDANCE,
    Permission.VIEW_DEPARTMENT_LOCATIONS,
  ],

  [UserRole.CONTROL_ROOM]: [
    // Control room - view only, all locations and attendance
    Permission.VIEW_ALL_LOCATIONS,
    Permission.VIEW_ALL_ATTENDANCE,
  ],

  [UserRole.STAFF]: [
    // Staff - own data only
    Permission.VIEW_OWN_STAFF,
    Permission.VIEW_OWN_LEAVES,
    Permission.APPLY_LEAVE,
    Permission.CANCEL_LEAVE,
    Permission.VIEW_OWN_ATTENDANCE,
    Permission.CHECK_IN,
    Permission.CHECK_OUT,
    Permission.VIEW_OWN_LOCATIONS,
    Permission.VIEW_OWN_PAYROLL,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if role can approve leaves at a specific level
 */
export function canApproveLeave(role: UserRole, level: 1 | 2): boolean {
  const permissions = rolePermissions[role] || [];

  if (level === 1) {
    return permissions.includes(Permission.APPROVE_LEAVE_LEVEL_1);
  }

  if (level === 2) {
    return permissions.includes(Permission.APPROVE_LEAVE_LEVEL_2);
  }

  return false;
}

/**
 * Check if role requires business assignment
 */
export function requiresBusiness(role: UserRole): boolean {
  return role !== UserRole.SUPER_ADMIN && role !== UserRole.CONTROL_ROOM;
}

/**
 * Check if role requires department assignment
 */
export function requiresDepartment(role: UserRole): boolean {
  return role === UserRole.DEPARTMENT_HEAD;
}
