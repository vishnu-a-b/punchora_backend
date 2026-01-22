"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDataFiltersEnhanced = exports.validateBusinessParam = exports.applyBusinessScoping = exports.enforceDepartmentScope = exports.enforceBusinessScope = exports.validateBusinessAssignment = void 0;
const roles_1 = require("../constants/roles");
const Staff_1 = require("../modules/staff/models/Staff");
/**
 * Validate that user has required business assignment
 */
const validateBusinessAssignment = (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            error: "Authentication required",
        });
    }
    // Roles that MUST have business assignment
    const businessRequiredRoles = [
        roles_1.UserRole.BUSINESS_ADMIN,
        roles_1.UserRole.HR_ADMIN,
        roles_1.UserRole.DEPARTMENT_HEAD,
    ];
    if (businessRequiredRoles.includes(user.role)) {
        if (!user.business) {
            return res.status(403).json({
                success: false,
                error: `${user.role} must have an assigned business`,
                code: "MISSING_BUSINESS_ASSIGNMENT",
            });
        }
    }
    // Department head must have department
    if (user.role === roles_1.UserRole.DEPARTMENT_HEAD) {
        if (!user.department) {
            return res.status(403).json({
                success: false,
                error: "Department head must have an assigned department",
                code: "MISSING_DEPARTMENT_ASSIGNMENT",
            });
        }
    }
    next();
};
exports.validateBusinessAssignment = validateBusinessAssignment;
/**
 * Enforce business scoping - prevents accessing other businesses
 */
const enforceBusinessScope = (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            error: "Authentication required",
        });
    }
    // Super admin and control room can access all businesses
    if (user.role === roles_1.UserRole.SUPER_ADMIN ||
        user.role === roles_1.UserRole.CONTROL_ROOM) {
        return next();
    }
    // Roles that must be scoped to their business
    const businessScopedRoles = [
        roles_1.UserRole.BUSINESS_ADMIN,
        roles_1.UserRole.HR_ADMIN,
        roles_1.UserRole.DEPARTMENT_HEAD,
    ];
    if (businessScopedRoles.includes(user.role)) {
        // Check query parameters
        if (req.query.business && req.query.business !== user.business) {
            return res.status(403).json({
                success: false,
                error: "Cannot access data from other businesses",
                code: "BUSINESS_SCOPE_VIOLATION",
                attempted: req.query.business,
                allowed: user.business,
            });
        }
        // Check body parameters (for POST/PUT requests)
        if (req.body.business && req.body.business !== user.business) {
            return res.status(403).json({
                success: false,
                error: "Cannot create/update data for other businesses",
                code: "BUSINESS_SCOPE_VIOLATION",
                attempted: req.body.business,
                allowed: user.business,
            });
        }
        // Force business filter in request
        req.businessFilter = { business: user.business };
        // Also set in query params to ensure controllers use it
        req.query.business = user.business;
    }
    next();
};
exports.enforceBusinessScope = enforceBusinessScope;
/**
 * Enforce department scoping for department heads
 * PHASE 4: Supports multi-department assignments
 */
const enforceDepartmentScope = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            error: "Authentication required",
        });
    }
    // Only department heads are restricted to department
    if (user.role !== roles_1.UserRole.DEPARTMENT_HEAD) {
        return next();
    }
    try {
        // PHASE 4: Fetch all departments (primary + additional) for department head
        let allDepartments;
        // Use cached departments if available
        if (req.allDepartments) {
            allDepartments = req.allDepartments;
        }
        else {
            // Fetch staff record to get all departments
            const staff = yield Staff_1.Staff.findOne({ user: user._id })
                .select("department additionalDepartments")
                .lean();
            if (!staff) {
                // Fallback to single department from user
                allDepartments = user.department ? [user.department] : [];
            }
            else {
                // Combine primary and additional departments
                allDepartments = [staff.department.toString()];
                if (staff.additionalDepartments && staff.additionalDepartments.length > 0) {
                    staff.additionalDepartments.forEach((dept) => {
                        const deptStr = dept.toString();
                        if (!allDepartments.includes(deptStr)) {
                            allDepartments.push(deptStr);
                        }
                    });
                }
            }
            // Cache for subsequent middleware/controllers
            req.allDepartments = allDepartments;
        }
        // Check query parameters - allow if in any of user's departments
        if (req.query.department) {
            const requestedDept = req.query.department;
            if (!allDepartments.includes(requestedDept)) {
                return res.status(403).json({
                    success: false,
                    error: "Cannot access data from other departments",
                    code: "DEPARTMENT_SCOPE_VIOLATION",
                    attempted: requestedDept,
                    allowed: allDepartments,
                });
            }
        }
        else {
            // No specific department requested - apply filter for all user's departments
            if (allDepartments.length === 1) {
                // Single department - use simple filter for backward compatibility
                req.departmentFilter = { department: allDepartments[0] };
            }
            else if (allDepartments.length > 1) {
                // Multiple departments - use $in filter
                req.departmentFilter = {
                    $or: [
                        { department: { $in: allDepartments } },
                        { additionalDepartments: { $in: allDepartments } },
                    ],
                };
            }
        }
        next();
    }
    catch (error) {
        console.error("[enforceDepartmentScope] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to enforce department scoping",
        });
    }
});
exports.enforceDepartmentScope = enforceDepartmentScope;
/**
 * Combined middleware: validate + enforce business and department scoping
 * Use this on all routes that deal with business-scoped data
 */
exports.applyBusinessScoping = [
    exports.validateBusinessAssignment,
    exports.enforceBusinessScope,
    exports.enforceDepartmentScope,
];
/**
 * Validate business ID in URL parameter
 * Use on routes like /businesses/:id to ensure user can only access their business
 */
const validateBusinessParam = (req, res, next) => {
    const user = req.user;
    const businessId = req.params.id || req.params.businessId;
    if (!user) {
        return res.status(401).json({
            success: false,
            error: "Authentication required",
        });
    }
    // Super admin can access any business
    if (user.role === roles_1.UserRole.SUPER_ADMIN || user.role === roles_1.UserRole.CONTROL_ROOM) {
        return next();
    }
    // Business-scoped roles can only access their own business
    const businessScopedRoles = [
        roles_1.UserRole.BUSINESS_ADMIN,
        roles_1.UserRole.HR_ADMIN,
        roles_1.UserRole.DEPARTMENT_HEAD,
    ];
    if (businessScopedRoles.includes(user.role)) {
        if (businessId && businessId !== user.business) {
            return res.status(403).json({
                success: false,
                error: "Cannot access other business",
                code: "BUSINESS_PARAM_VIOLATION",
            });
        }
    }
    next();
};
exports.validateBusinessParam = validateBusinessParam;
/**
 * For backward compatibility - maintains same interface as applyDataFilters
 * but with enhanced validation
 */
exports.applyDataFiltersEnhanced = exports.applyBusinessScoping;
