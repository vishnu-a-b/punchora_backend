"use strict";
/**
 * Role Constants and Permissions
 * Defines all user roles and their associated permissions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissions = exports.Permission = exports.UserRole = void 0;
exports.hasPermission = hasPermission;
exports.getPermissionsForRole = getPermissionsForRole;
exports.canApproveLeave = canApproveLeave;
exports.requiresBusiness = requiresBusiness;
exports.requiresDepartment = requiresDepartment;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super-admin";
    UserRole["BUSINESS_ADMIN"] = "business-admin";
    UserRole["HR_ADMIN"] = "hr-admin";
    UserRole["DEPARTMENT_HEAD"] = "department-head";
    UserRole["CONTROL_ROOM"] = "control-room";
    UserRole["STAFF"] = "staff";
})(UserRole || (exports.UserRole = UserRole = {}));
var Permission;
(function (Permission) {
    // Business permissions
    Permission["VIEW_ALL_BUSINESSES"] = "view:all-businesses";
    Permission["SWITCH_BUSINESS"] = "switch:business";
    Permission["CREATE_BUSINESS"] = "create:business";
    Permission["EDIT_BUSINESS"] = "edit:business";
    Permission["DELETE_BUSINESS"] = "delete:business";
    // Staff permissions
    Permission["VIEW_ALL_STAFF"] = "view:all-staff";
    Permission["VIEW_DEPARTMENT_STAFF"] = "view:department-staff";
    Permission["VIEW_OWN_STAFF"] = "view:own-staff";
    Permission["CREATE_STAFF"] = "create:staff";
    Permission["EDIT_STAFF"] = "edit:staff";
    Permission["DELETE_STAFF"] = "delete:staff";
    // Leave permissions
    Permission["VIEW_ALL_LEAVES"] = "view:all-leaves";
    Permission["VIEW_DEPARTMENT_LEAVES"] = "view:department-leaves";
    Permission["VIEW_OWN_LEAVES"] = "view:own-leaves";
    Permission["APPLY_LEAVE"] = "apply:leave";
    Permission["APPROVE_LEAVE_LEVEL_1"] = "approve:leave-level-1";
    Permission["APPROVE_LEAVE_LEVEL_2"] = "approve:leave-level-2";
    Permission["REJECT_LEAVE"] = "reject:leave";
    Permission["CANCEL_LEAVE"] = "cancel:leave";
    // Attendance permissions
    Permission["VIEW_ALL_ATTENDANCE"] = "view:all-attendance";
    Permission["VIEW_DEPARTMENT_ATTENDANCE"] = "view:department-attendance";
    Permission["VIEW_OWN_ATTENDANCE"] = "view:own-attendance";
    Permission["EDIT_ATTENDANCE"] = "edit:attendance";
    Permission["DELETE_ATTENDANCE"] = "delete:attendance";
    Permission["CHECK_IN"] = "checkin:attendance";
    Permission["CHECK_OUT"] = "checkout:attendance";
    // Geo tracking permissions
    Permission["VIEW_ALL_LOCATIONS"] = "view:all-locations";
    Permission["VIEW_DEPARTMENT_LOCATIONS"] = "view:department-locations";
    Permission["VIEW_OWN_LOCATIONS"] = "view:own-locations";
    // Department permissions
    Permission["VIEW_DEPARTMENTS"] = "view:departments";
    Permission["CREATE_DEPARTMENT"] = "create:department";
    Permission["EDIT_DEPARTMENT"] = "edit:department";
    Permission["DELETE_DEPARTMENT"] = "delete:department";
    // Payroll permissions
    Permission["VIEW_ALL_PAYROLL"] = "view:all-payroll";
    Permission["VIEW_OWN_PAYROLL"] = "view:own-payroll";
    Permission["EDIT_PAYROLL"] = "edit:payroll";
    Permission["PROCESS_PAYROLL"] = "process:payroll";
    // Settings permissions
    Permission["VIEW_SETTINGS"] = "view:settings";
    Permission["EDIT_SETTINGS"] = "edit:settings";
})(Permission || (exports.Permission = Permission = {}));
// Role to Permissions mapping
exports.rolePermissions = {
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
function hasPermission(role, permission) {
    var _a;
    return ((_a = exports.rolePermissions[role]) === null || _a === void 0 ? void 0 : _a.includes(permission)) || false;
}
/**
 * Get all permissions for a role
 */
function getPermissionsForRole(role) {
    return exports.rolePermissions[role] || [];
}
/**
 * Check if role can approve leaves at a specific level
 */
function canApproveLeave(role, level) {
    const permissions = exports.rolePermissions[role] || [];
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
function requiresBusiness(role) {
    return role !== UserRole.SUPER_ADMIN && role !== UserRole.CONTROL_ROOM;
}
/**
 * Check if role requires department assignment
 */
function requiresDepartment(role) {
    return role === UserRole.DEPARTMENT_HEAD;
}
