"use strict";
/**
 * Audit Middleware
 *
 * Automatically logs significant API requests to the audit trail.
 * Can be applied globally or to specific routes.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = auditMiddleware;
exports.logAuditEvent = logAuditEvent;
const AuditService_1 = __importDefault(require("../modules/audit/services/AuditService"));
const AuditLog_1 = require("../modules/audit/models/AuditLog");
const auditService = new AuditService_1.default();
/**
 * Map HTTP method and route to audit action
 */
function inferActionFromRoute(path, method) {
    const normalizedPath = path.toLowerCase();
    // Authentication routes
    if (normalizedPath.includes("/auth/login"))
        return AuditLog_1.AuditAction.LOGIN;
    if (normalizedPath.includes("/auth/logout"))
        return AuditLog_1.AuditAction.LOGOUT;
    // User routes
    if (normalizedPath.includes("/user")) {
        if (method === "POST")
            return AuditLog_1.AuditAction.USER_CREATE;
        if (method === "PUT" || method === "PATCH")
            return AuditLog_1.AuditAction.USER_UPDATE;
        if (method === "DELETE")
            return AuditLog_1.AuditAction.USER_DELETE;
    }
    // Staff routes
    if (normalizedPath.includes("/staff")) {
        if (method === "POST")
            return AuditLog_1.AuditAction.STAFF_CREATE;
        if (method === "PUT" || method === "PATCH")
            return AuditLog_1.AuditAction.STAFF_UPDATE;
        if (method === "DELETE")
            return AuditLog_1.AuditAction.STAFF_DELETE;
    }
    // Attendance routes
    if (normalizedPath.includes("/attendance")) {
        if (normalizedPath.includes("/mark"))
            return AuditLog_1.AuditAction.ATTENDANCE_MARK;
        if (normalizedPath.includes("/flag"))
            return AuditLog_1.AuditAction.ATTENDANCE_FLAG;
        if (normalizedPath.includes("/review"))
            return AuditLog_1.AuditAction.ATTENDANCE_REVIEW;
        if (method === "POST" && !normalizedPath.includes("/mark"))
            return AuditLog_1.AuditAction.ATTENDANCE_CREATE;
        if (method === "PUT" || method === "PATCH")
            return AuditLog_1.AuditAction.ATTENDANCE_UPDATE;
        if (method === "DELETE")
            return AuditLog_1.AuditAction.ATTENDANCE_DELETE;
    }
    // Alert routes
    if (normalizedPath.includes("/alerts")) {
        if (normalizedPath.includes("/acknowledge"))
            return AuditLog_1.AuditAction.ALERT_ACKNOWLEDGE;
        if (normalizedPath.includes("/resolve"))
            return AuditLog_1.AuditAction.ALERT_RESOLVE;
        if (normalizedPath.includes("/dismiss"))
            return AuditLog_1.AuditAction.ALERT_DISMISS;
    }
    // Leave request routes
    if (normalizedPath.includes("/leave")) {
        if (normalizedPath.includes("/approve"))
            return AuditLog_1.AuditAction.LEAVE_APPROVE;
        if (normalizedPath.includes("/reject"))
            return AuditLog_1.AuditAction.LEAVE_REJECT;
        if (normalizedPath.includes("/cancel"))
            return AuditLog_1.AuditAction.LEAVE_CANCEL;
        if (method === "POST")
            return AuditLog_1.AuditAction.LEAVE_REQUEST_CREATE;
        if (method === "PUT" || method === "PATCH")
            return AuditLog_1.AuditAction.LEAVE_REQUEST_UPDATE;
        if (method === "DELETE")
            return AuditLog_1.AuditAction.LEAVE_REQUEST_DELETE;
    }
    // Business routes
    if (normalizedPath.includes("/business")) {
        if (method === "POST")
            return AuditLog_1.AuditAction.BUSINESS_CREATE;
        if (method === "PUT" || method === "PATCH")
            return AuditLog_1.AuditAction.BUSINESS_UPDATE;
        if (method === "DELETE")
            return AuditLog_1.AuditAction.BUSINESS_DELETE;
    }
    // Department routes
    if (normalizedPath.includes("/department")) {
        if (method === "POST")
            return AuditLog_1.AuditAction.DEPARTMENT_CREATE;
        if (method === "PUT" || method === "PATCH")
            return AuditLog_1.AuditAction.DEPARTMENT_UPDATE;
        if (method === "DELETE")
            return AuditLog_1.AuditAction.DEPARTMENT_DELETE;
    }
    // Report routes
    if (normalizedPath.includes("/report")) {
        if (normalizedPath.includes("/export"))
            return AuditLog_1.AuditAction.REPORT_EXPORT;
        if (method === "GET" || method === "POST")
            return AuditLog_1.AuditAction.REPORT_GENERATE;
    }
    // Job routes
    if (normalizedPath.includes("/jobs/run"))
        return AuditLog_1.AuditAction.JOB_EXECUTE;
    // Settings routes
    if (normalizedPath.includes("/settings")) {
        if (method === "PUT" || method === "PATCH")
            return AuditLog_1.AuditAction.SETTINGS_UPDATE;
    }
    return null; // Don't log this action
}
/**
 * Extract resource type from path
 */
function extractResourceFromPath(path) {
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
function extractResourceIdFromPath(path, method) {
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
function shouldLog(action, method) {
    // Don't log if no action determined
    if (!action)
        return false;
    // Always log mutations (POST, PUT, PATCH, DELETE)
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method))
        return true;
    // Always log authentication
    if ([AuditLog_1.AuditAction.LOGIN, AuditLog_1.AuditAction.LOGOUT, AuditLog_1.AuditAction.LOGIN_FAILED].includes(action)) {
        return true;
    }
    // Don't log GET requests (too noisy)
    return false;
}
/**
 * Audit middleware - logs significant API requests
 */
function auditMiddleware(req, res, next) {
    const startTime = Date.now();
    // Capture original res.json
    const originalJson = res.json.bind(res);
    // Override res.json to capture response
    res.json = function (body) {
        // After response is sent
        setImmediate(() => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const duration = Date.now() - startTime;
            const user = req.user;
            // Determine action from route and method
            const action = inferActionFromRoute(req.path, req.method);
            // Check if we should log this
            if (shouldLog(action, req.method)) {
                const resource = extractResourceFromPath(req.path);
                const resourceId = extractResourceIdFromPath(req.path, req.method) || ((_a = body === null || body === void 0 ? void 0 : body.data) === null || _a === void 0 ? void 0 : _a._id);
                yield auditService.logAsync({
                    action: action,
                    resource,
                    resourceId,
                    userId: (_b = user === null || user === void 0 ? void 0 : user._id) === null || _b === void 0 ? void 0 : _b.toString(),
                    userName: user === null || user === void 0 ? void 0 : user.name,
                    userRole: user === null || user === void 0 ? void 0 : user.role,
                    userEmail: user === null || user === void 0 ? void 0 : user.email,
                    business: (_c = user === null || user === void 0 ? void 0 : user.business) === null || _c === void 0 ? void 0 : _c.toString(),
                    department: (_d = user === null || user === void 0 ? void 0 : user.department) === null || _d === void 0 ? void 0 : _d.toString(),
                    ipAddress: req.ip || req.socket.remoteAddress,
                    userAgent: req.get("user-agent"),
                    endpoint: req.path,
                    method: req.method,
                    status: res.statusCode < 400 ? "success" : "failure",
                    errorMessage: res.statusCode >= 400 ? body === null || body === void 0 ? void 0 : body.error : undefined,
                    metadata: {
                        duration,
                        statusCode: res.statusCode,
                    },
                });
            }
        }));
        return originalJson(body);
    };
    next();
}
/**
 * Helper to manually log an audit event
 * Use this for actions that can't be automatically detected
 */
function logAuditEvent(req, action, resource, resourceId, changes, metadata) {
    var _a, _b, _c;
    const user = req.user;
    auditService.logAsync({
        action,
        resource,
        resourceId,
        userId: (_a = user === null || user === void 0 ? void 0 : user._id) === null || _a === void 0 ? void 0 : _a.toString(),
        userName: user === null || user === void 0 ? void 0 : user.name,
        userRole: user === null || user === void 0 ? void 0 : user.role,
        userEmail: user === null || user === void 0 ? void 0 : user.email,
        business: (_b = user === null || user === void 0 ? void 0 : user.business) === null || _b === void 0 ? void 0 : _b.toString(),
        department: (_c = user === null || user === void 0 ? void 0 : user.department) === null || _c === void 0 ? void 0 : _c.toString(),
        changes,
        metadata,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
        endpoint: req.path,
        method: req.method,
        status: "success",
    });
}
exports.default = auditMiddleware;
