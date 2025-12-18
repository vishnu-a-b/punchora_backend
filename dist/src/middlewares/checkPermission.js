"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDataFilters = exports.filterByDepartment = exports.filterByBusiness = exports.checkLeaveApprovalPermission = exports.checkRole = exports.checkPermission = void 0;
const roles_1 = require("../constants/roles");
/**
 * Middleware to check if user has required permission
 */
const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized - No user found',
                });
            }
            const userRole = user.role;
            if (!(0, roles_1.hasPermission)(userRole, requiredPermission)) {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden - Insufficient permissions',
                    required: requiredPermission,
                    userRole: userRole,
                });
            }
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Error checking permissions',
            });
        }
    };
};
exports.checkPermission = checkPermission;
/**
 * Middleware to check if user has one of the required roles
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized - No user found',
                });
            }
            const userRole = user.role;
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden - Role not allowed',
                    allowedRoles: allowedRoles,
                    userRole: userRole,
                });
            }
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Error checking role',
            });
        }
    };
};
exports.checkRole = checkRole;
/**
 * Middleware to check leave approval permissions
 */
const checkLeaveApprovalPermission = (level) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized - No user found',
                });
            }
            const userRole = user.role;
            if (!(0, roles_1.canApproveLeave)(userRole, level)) {
                return res.status(403).json({
                    success: false,
                    error: `Forbidden - Cannot approve leaves at level ${level}`,
                    userRole: userRole,
                });
            }
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Error checking leave approval permission',
            });
        }
    };
};
exports.checkLeaveApprovalPermission = checkLeaveApprovalPermission;
/**
 * Middleware to filter queries by business
 * Automatically adds business filter for non-super-admin users
 */
const filterByBusiness = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - No user found',
            });
        }
        // Super admin and control room can see all businesses
        if (user.role === roles_1.UserRole.SUPER_ADMIN || user.role === roles_1.UserRole.CONTROL_ROOM) {
            return next();
        }
        // For all other roles, filter by their assigned business
        if (!user.business) {
            return res.status(400).json({
                success: false,
                error: 'User does not have an assigned business',
            });
        }
        // Add business filter to request
        req.businessFilter = { business: user.business };
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Error filtering by business',
        });
    }
};
exports.filterByBusiness = filterByBusiness;
/**
 * Middleware to filter queries by department
 * Automatically adds department filter for department heads
 */
const filterByDepartment = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - No user found',
            });
        }
        // Department heads can only see their department
        if (user.role === roles_1.UserRole.DEPARTMENT_HEAD) {
            if (!user.department) {
                return res.status(400).json({
                    success: false,
                    error: 'Department head does not have an assigned department',
                });
            }
            // Add department filter to request
            req.departmentFilter = { department: user.department };
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Error filtering by department',
        });
    }
};
exports.filterByDepartment = filterByDepartment;
/**
 * Combined middleware to apply business and department filters
 */
exports.applyDataFilters = [exports.filterByBusiness, exports.filterByDepartment];
