import { Request, Response, NextFunction } from "express";
import { UserRole } from "../constants/roles";
import { Staff } from "../modules/staff/models/Staff";

/**
 * Enhanced Business Scoping Validator
 *
 * Ensures that business-scoped roles (business-admin, hr-admin, department-head)
 * can ONLY access data from their assigned business.
 *
 * This middleware validates that:
 * 1. User has a business assigned (if required by role)
 * 2. Query parameters don't try to access other businesses
 * 3. Body parameters don't reference other businesses
 * 4. Enforces business filter in req object
 *
 * PHASE 4 Enhancement:
 * 5. Department heads can manage multiple departments (primary + additional)
 */

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: UserRole;
    business?: string;
    department?: string;
    email: string;
  };
  businessFilter?: Record<string, any>;
  departmentFilter?: Record<string, any>;
  allDepartments?: string[]; // PHASE 4: Cache for all departments
}

/**
 * Validate that user has required business assignment
 */
export const validateBusinessAssignment = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  // Roles that MUST have business assignment
  const businessRequiredRoles = [
    UserRole.BUSINESS_ADMIN,
    UserRole.HR_ADMIN,
    UserRole.DEPARTMENT_HEAD,
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
  if (user.role === UserRole.DEPARTMENT_HEAD) {
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

/**
 * Enforce business scoping - prevents accessing other businesses
 */
export const enforceBusinessScope = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  // Super admin and control room can access all businesses
  if (
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.CONTROL_ROOM
  ) {
    return next();
  }

  // Roles that must be scoped to their business
  const businessScopedRoles = [
    UserRole.BUSINESS_ADMIN,
    UserRole.HR_ADMIN,
    UserRole.DEPARTMENT_HEAD,
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

/**
 * Enforce department scoping for department heads
 * PHASE 4: Supports multi-department assignments
 */
export const enforceDepartmentScope = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  // Only department heads are restricted to department
  if (user.role !== UserRole.DEPARTMENT_HEAD) {
    return next();
  }

  try {
    // PHASE 4: Fetch all departments (primary + additional) for department head
    let allDepartments: string[];

    // Use cached departments if available
    if (req.allDepartments) {
      allDepartments = req.allDepartments;
    } else {
      // Fetch staff record to get all departments
      const staff = await Staff.findOne({ user: user._id })
        .select("department additionalDepartments")
        .lean();

      if (!staff) {
        // Fallback to single department from user
        allDepartments = user.department ? [user.department] : [];
      } else {
        // Combine primary and additional departments
        allDepartments = [staff.department.toString()];
        if (staff.additionalDepartments && staff.additionalDepartments.length > 0) {
          staff.additionalDepartments.forEach((dept: any) => {
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
      const requestedDept = req.query.department as string;
      if (!allDepartments.includes(requestedDept)) {
        return res.status(403).json({
          success: false,
          error: "Cannot access data from other departments",
          code: "DEPARTMENT_SCOPE_VIOLATION",
          attempted: requestedDept,
          allowed: allDepartments,
        });
      }
    } else {
      // No specific department requested - apply filter for all user's departments
      if (allDepartments.length === 1) {
        // Single department - use simple filter for backward compatibility
        req.departmentFilter = { department: allDepartments[0] };
      } else if (allDepartments.length > 1) {
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
  } catch (error) {
    console.error("[enforceDepartmentScope] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to enforce department scoping",
    });
  }
};

/**
 * Combined middleware: validate + enforce business and department scoping
 * Use this on all routes that deal with business-scoped data
 */
export const applyBusinessScoping = [
  validateBusinessAssignment,
  enforceBusinessScope,
  enforceDepartmentScope,
];

/**
 * Validate business ID in URL parameter
 * Use on routes like /businesses/:id to ensure user can only access their business
 */
export const validateBusinessParam = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const businessId = req.params.id || req.params.businessId;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  // Super admin can access any business
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.CONTROL_ROOM) {
    return next();
  }

  // Business-scoped roles can only access their own business
  const businessScopedRoles = [
    UserRole.BUSINESS_ADMIN,
    UserRole.HR_ADMIN,
    UserRole.DEPARTMENT_HEAD,
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

/**
 * For backward compatibility - maintains same interface as applyDataFilters
 * but with enhanced validation
 */
export const applyDataFiltersEnhanced = applyBusinessScoping;
