import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission, hasPermission, canApproveLeave } from '../constants/roles';

/**
 * Middleware to check if user has required permission
 */
export const checkPermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - No user found',
        });
      }

      const userRole = user.role as UserRole;

      if (!hasPermission(userRole, requiredPermission)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden - Insufficient permissions',
          required: requiredPermission,
          userRole: userRole,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions',
      });
    }
  };
};

/**
 * Middleware to check if user has one of the required roles
 */
export const checkRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - No user found',
        });
      }

      const userRole = user.role as UserRole;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden - Role not allowed',
          allowedRoles: allowedRoles,
          userRole: userRole,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking role',
      });
    }
  };
};

/**
 * Middleware to check leave approval permissions
 */
export const checkLeaveApprovalPermission = (level: 1 | 2) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - No user found',
        });
      }

      const userRole = user.role as UserRole;

      if (!canApproveLeave(userRole, level)) {
        return res.status(403).json({
          success: false,
          error: `Forbidden - Cannot approve leaves at level ${level}`,
          userRole: userRole,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking leave approval permission',
      });
    }
  };
};

/**
 * Middleware to filter queries by business
 * Automatically adds business filter for non-super-admin users
 */
export const filterByBusiness = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No user found',
      });
    }

    // Super admin and control room can see all businesses
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.CONTROL_ROOM) {
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
    (req as any).businessFilter = { business: user.business };
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error filtering by business',
    });
  }
};

/**
 * Middleware to filter queries by department
 * Automatically adds department filter for department heads
 */
export const filterByDepartment = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No user found',
      });
    }

    // Department heads can only see their department
    if (user.role === UserRole.DEPARTMENT_HEAD) {
      if (!user.department) {
        return res.status(400).json({
          success: false,
          error: 'Department head does not have an assigned department',
        });
      }

      // Add department filter to request
      (req as any).departmentFilter = { department: user.department };
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error filtering by department',
    });
  }
};

/**
 * Combined middleware to apply business and department filters
 */
export const applyDataFilters = [filterByBusiness, filterByDepartment];
