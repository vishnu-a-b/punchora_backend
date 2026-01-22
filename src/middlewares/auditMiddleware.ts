/**
 * Audit Middleware
 *
 * Automatically logs significant API requests to the audit trail.
 * Can be applied globally or to specific routes.
 */

import { Request, Response, NextFunction } from "express";
import AuditService from "../modules/audit/services/AuditService";
import { AuditAction } from "../modules/audit/models/AuditLog";

const auditService = new AuditService();

/**
 * Map HTTP method and route to audit action
 */
function inferActionFromRoute(path: string, method: string): AuditAction | null {
  const normalizedPath = path.toLowerCase();

  // Authentication routes
  if (normalizedPath.includes("/auth/login")) return AuditAction.LOGIN;
  if (normalizedPath.includes("/auth/logout")) return AuditAction.LOGOUT;

  // User routes
  if (normalizedPath.includes("/user")) {
    if (method === "POST") return AuditAction.USER_CREATE;
    if (method === "PUT" || method === "PATCH") return AuditAction.USER_UPDATE;
    if (method === "DELETE") return AuditAction.USER_DELETE;
  }

  // Staff routes
  if (normalizedPath.includes("/staff")) {
    if (method === "POST") return AuditAction.STAFF_CREATE;
    if (method === "PUT" || method === "PATCH") return AuditAction.STAFF_UPDATE;
    if (method === "DELETE") return AuditAction.STAFF_DELETE;
  }

  // Attendance routes
  if (normalizedPath.includes("/attendance")) {
    if (normalizedPath.includes("/mark")) return AuditAction.ATTENDANCE_MARK;
    if (normalizedPath.includes("/flag")) return AuditAction.ATTENDANCE_FLAG;
    if (normalizedPath.includes("/review")) return AuditAction.ATTENDANCE_REVIEW;
    if (method === "POST" && !normalizedPath.includes("/mark")) return AuditAction.ATTENDANCE_CREATE;
    if (method === "PUT" || method === "PATCH") return AuditAction.ATTENDANCE_UPDATE;
    if (method === "DELETE") return AuditAction.ATTENDANCE_DELETE;
  }

  // Alert routes
  if (normalizedPath.includes("/alerts")) {
    if (normalizedPath.includes("/acknowledge")) return AuditAction.ALERT_ACKNOWLEDGE;
    if (normalizedPath.includes("/resolve")) return AuditAction.ALERT_RESOLVE;
    if (normalizedPath.includes("/dismiss")) return AuditAction.ALERT_DISMISS;
  }

  // Leave request routes
  if (normalizedPath.includes("/leave")) {
    if (normalizedPath.includes("/approve")) return AuditAction.LEAVE_APPROVE;
    if (normalizedPath.includes("/reject")) return AuditAction.LEAVE_REJECT;
    if (normalizedPath.includes("/cancel")) return AuditAction.LEAVE_CANCEL;
    if (method === "POST") return AuditAction.LEAVE_REQUEST_CREATE;
    if (method === "PUT" || method === "PATCH") return AuditAction.LEAVE_REQUEST_UPDATE;
    if (method === "DELETE") return AuditAction.LEAVE_REQUEST_DELETE;
  }

  // Business routes
  if (normalizedPath.includes("/business")) {
    if (method === "POST") return AuditAction.BUSINESS_CREATE;
    if (method === "PUT" || method === "PATCH") return AuditAction.BUSINESS_UPDATE;
    if (method === "DELETE") return AuditAction.BUSINESS_DELETE;
  }

  // Department routes
  if (normalizedPath.includes("/department")) {
    if (method === "POST") return AuditAction.DEPARTMENT_CREATE;
    if (method === "PUT" || method === "PATCH") return AuditAction.DEPARTMENT_UPDATE;
    if (method === "DELETE") return AuditAction.DEPARTMENT_DELETE;
  }

  // Report routes
  if (normalizedPath.includes("/report")) {
    if (normalizedPath.includes("/export")) return AuditAction.REPORT_EXPORT;
    if (method === "GET" || method === "POST") return AuditAction.REPORT_GENERATE;
  }

  // Job routes
  if (normalizedPath.includes("/jobs/run")) return AuditAction.JOB_EXECUTE;

  // Settings routes
  if (normalizedPath.includes("/settings")) {
    if (method === "PUT" || method === "PATCH") return AuditAction.SETTINGS_UPDATE;
  }

  return null; // Don't log this action
}

/**
 * Extract resource type from path
 */
function extractResourceFromPath(path: string): string {
  const parts = path.split("/").filter((p) => p);

  // Get the main resource from path
  // e.g., /v1/staff/123 -> staff
  if (parts.length >= 2) {
    return parts[1]; // Usually the resource is after /v1/
  }

  return "unknown";
}

/**
 * Extract resource ID from path
 */
function extractResourceIdFromPath(path: string, method: string): string | undefined {
  // For PUT, PATCH, DELETE, ID is usually in the path
  if (["PUT", "PATCH", "DELETE"].includes(method)) {
    const parts = path.split("/").filter((p) => p);
    // Get last part if it looks like an ID (not a word like "flag", "review")
    const lastPart = parts[parts.length - 1];
    if (lastPart && !lastPart.includes("-") && lastPart.length > 10) {
      return lastPart;
    }
  }

  return undefined;
}

/**
 * Determine if this action should be logged
 */
function shouldLog(action: AuditAction | null, method: string): boolean {
  // Don't log if no action determined
  if (!action) return false;

  // Always log mutations (POST, PUT, PATCH, DELETE)
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) return true;

  // Always log authentication
  if ([AuditAction.LOGIN, AuditAction.LOGOUT, AuditAction.LOGIN_FAILED].includes(action)) {
    return true;
  }

  // Don't log GET requests (too noisy)
  return false;
}

/**
 * Audit middleware - logs significant API requests
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Capture original res.json
  const originalJson = res.json.bind(res);

  // Override res.json to capture response
  res.json = function (body: any): Response {
    // After response is sent
    setImmediate(async () => {
      const duration = Date.now() - startTime;
      const user = (req as any).user;

      // Determine action from route and method
      const action = inferActionFromRoute(req.path, req.method);

      // Check if we should log this
      if (shouldLog(action, req.method)) {
        const resource = extractResourceFromPath(req.path);
        const resourceId = extractResourceIdFromPath(req.path, req.method) || body?.data?._id;

        await auditService.logAsync({
          action: action!,
          resource,
          resourceId,
          userId: user?._id?.toString(),
          userName: user?.name,
          userRole: user?.role,
          userEmail: user?.email,
          business: user?.business?.toString(),
          department: user?.department?.toString(),
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get("user-agent"),
          endpoint: req.path,
          method: req.method,
          status: res.statusCode < 400 ? "success" : "failure",
          errorMessage: res.statusCode >= 400 ? body?.error : undefined,
          metadata: {
            duration,
            statusCode: res.statusCode,
          },
        });
      }
    });

    return originalJson(body);
  };

  next();
}

/**
 * Helper to manually log an audit event
 * Use this for actions that can't be automatically detected
 */
export function logAuditEvent(
  req: Request,
  action: AuditAction,
  resource: string,
  resourceId?: string,
  changes?: { before?: any; after?: any },
  metadata?: any
): void {
  const user = (req as any).user;

  auditService.logAsync({
    action,
    resource,
    resourceId,
    userId: user?._id?.toString(),
    userName: user?.name,
    userRole: user?.role,
    userEmail: user?.email,
    business: user?.business?.toString(),
    department: user?.department?.toString(),
    changes,
    metadata,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
    endpoint: req.path,
    method: req.method,
    status: "success",
  });
}

export default auditMiddleware;
