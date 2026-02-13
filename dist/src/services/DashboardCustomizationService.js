"use strict";
/**
 * Dashboard Customization Service
 * Manages role-based dashboard layouts and user customizations
 * Phase 6: Admin Dashboard Enhancements
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
const DashboardCustomization_1 = require("../modules/dashboard/models/DashboardCustomization");
const CacheService_1 = __importDefault(require("./CacheService"));
class DashboardCustomizationService {
    constructor() {
        this.cacheService = CacheService_1.default;
        this.CACHE_TTL = 3600; // 1 hour
        // cacheService is already initialized as singleton
    }
    /**
     * Get dashboard layout for user
     * Returns role-based default if no customization exists
     */
    getLayoutForUser(userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = `dashboard:layout:${userId}`;
            // Try cache first
            const cached = yield this.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
            // Find user customization
            const customization = yield DashboardCustomization_1.DashboardCustomization.findOne({ userId });
            let layout;
            if (customization) {
                layout = {
                    userId: customization.userId,
                    role: customization.role,
                    widgets: customization.widgets,
                    lastModified: customization.updatedAt || customization.createdAt
                };
            }
            else {
                // Return role-based default
                layout = {
                    userId,
                    role,
                    widgets: this.getDefaultWidgetsForRole(role),
                    lastModified: new Date()
                };
            }
            // Cache for 1 hour
            yield this.cacheService.set(cacheKey, layout, this.CACHE_TTL);
            return layout;
        });
    }
    /**
     * Save user dashboard customizations
     */
    saveUserCustomizations(userId, role, widgets) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate widgets
            const validation = this.validateWidgets(widgets);
            if (!validation.valid) {
                throw new Error(`Invalid widgets: ${validation.errors.join(', ')}`);
            }
            // Update or create customization
            const customization = yield DashboardCustomization_1.DashboardCustomization.findOneAndUpdate({ userId }, {
                userId,
                role,
                widgets
            }, { upsert: true, new: true });
            const layout = {
                userId: customization.userId,
                role: customization.role,
                widgets: customization.widgets,
                lastModified: customization.updatedAt || customization.createdAt
            };
            // Update cache
            const cacheKey = `dashboard:layout:${userId}`;
            yield this.cacheService.set(cacheKey, layout, this.CACHE_TTL);
            return layout;
        });
    }
    /**
     * Reset user customizations to role default
     */
    resetToDefault(userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            // Delete customization
            yield DashboardCustomization_1.DashboardCustomization.findOneAndDelete({ userId });
            // Clear cache
            const cacheKey = `dashboard:layout:${userId}`;
            yield this.cacheService.del(cacheKey);
            return {
                userId,
                role,
                widgets: this.getDefaultWidgetsForRole(role),
                lastModified: new Date()
            };
        });
    }
    /**
     * Get default widgets for a role
     */
    getDefaultWidgetsForRole(role) {
        switch (role.toLowerCase()) {
            case 'super_admin':
            case 'admin':
                return [
                    {
                        id: 'attendance-today',
                        type: 'metric',
                        title: 'Attendance Today',
                        position: { x: 0, y: 0, w: 3, h: 2 },
                        config: { metric: 'attendance.presentToday' }
                    },
                    {
                        id: 'active-alerts',
                        type: 'metric',
                        title: 'Active Alerts',
                        position: { x: 3, y: 0, w: 3, h: 2 },
                        config: { metric: 'alerts.activeAlerts' }
                    },
                    {
                        id: 'ongoing-activities',
                        type: 'metric',
                        title: 'Ongoing Activities',
                        position: { x: 6, y: 0, w: 3, h: 2 },
                        config: { metric: 'activities.ongoingActivities' }
                    },
                    {
                        id: 'staff-on-duty',
                        type: 'metric',
                        title: 'Staff On Duty',
                        position: { x: 9, y: 0, w: 3, h: 2 },
                        config: { metric: 'staff.onDuty' }
                    },
                    {
                        id: 'attendance-trend',
                        type: 'chart',
                        title: 'Attendance Trend (7 Days)',
                        position: { x: 0, y: 2, w: 6, h: 4 },
                        config: { chartType: 'line', metric: 'attendance', days: 7 }
                    },
                    {
                        id: 'alert-trend',
                        type: 'chart',
                        title: 'Alert Trend (7 Days)',
                        position: { x: 6, y: 2, w: 6, h: 4 },
                        config: { chartType: 'line', metric: 'alerts', days: 7 }
                    },
                    {
                        id: 'recent-alerts',
                        type: 'alert-list',
                        title: 'Recent Alerts',
                        position: { x: 0, y: 6, w: 12, h: 4 },
                        config: { limit: 10, severity: ['critical', 'high'] }
                    }
                ];
            case 'hr':
                return [
                    {
                        id: 'attendance-today',
                        type: 'metric',
                        title: 'Attendance Today',
                        position: { x: 0, y: 0, w: 4, h: 2 },
                        config: { metric: 'attendance.presentToday' }
                    },
                    {
                        id: 'late-checkins',
                        type: 'metric',
                        title: 'Late Check-ins',
                        position: { x: 4, y: 0, w: 4, h: 2 },
                        config: { metric: 'attendance.lateCheckins' }
                    },
                    {
                        id: 'missing-checkouts',
                        type: 'metric',
                        title: 'Missing Check-outs',
                        position: { x: 8, y: 0, w: 4, h: 2 },
                        config: { metric: 'attendance.missingCheckouts' }
                    },
                    {
                        id: 'attendance-trend',
                        type: 'chart',
                        title: 'Attendance Trend (14 Days)',
                        position: { x: 0, y: 2, w: 12, h: 4 },
                        config: { chartType: 'bar', metric: 'attendance', days: 14 }
                    },
                    {
                        id: 'flagged-records',
                        type: 'table',
                        title: 'Flagged Attendance Records',
                        position: { x: 0, y: 6, w: 12, h: 4 },
                        config: { dataSource: 'attendance.flagged', limit: 20 }
                    }
                ];
            case 'manager':
                return [
                    {
                        id: 'team-attendance',
                        type: 'metric',
                        title: 'Team Attendance',
                        position: { x: 0, y: 0, w: 6, h: 2 },
                        config: { metric: 'attendance.presentToday', scope: 'department' }
                    },
                    {
                        id: 'team-activities',
                        type: 'metric',
                        title: 'Team Activities',
                        position: { x: 6, y: 0, w: 6, h: 2 },
                        config: { metric: 'activities.ongoingActivities', scope: 'department' }
                    },
                    {
                        id: 'team-alerts',
                        type: 'alert-list',
                        title: 'Team Alerts',
                        position: { x: 0, y: 2, w: 12, h: 4 },
                        config: { limit: 10, scope: 'department' }
                    },
                    {
                        id: 'activity-trend',
                        type: 'chart',
                        title: 'Activity Trend (7 Days)',
                        position: { x: 0, y: 6, w: 12, h: 4 },
                        config: { chartType: 'line', metric: 'activities', days: 7, scope: 'department' }
                    }
                ];
            default:
                return [
                    {
                        id: 'attendance-today',
                        type: 'metric',
                        title: 'Attendance Today',
                        position: { x: 0, y: 0, w: 12, h: 2 },
                        config: { metric: 'attendance.presentToday' }
                    },
                    {
                        id: 'recent-alerts',
                        type: 'alert-list',
                        title: 'Recent Alerts',
                        position: { x: 0, y: 2, w: 12, h: 4 },
                        config: { limit: 5 }
                    }
                ];
        }
    }
    /**
     * Validate widget configuration
     */
    validateWidgets(widgets) {
        const errors = [];
        if (!widgets || widgets.length === 0) {
            errors.push('At least one widget is required');
            return { valid: false, errors };
        }
        const widgetIds = new Set();
        for (const widget of widgets) {
            // Unique ID
            if (widgetIds.has(widget.id)) {
                errors.push(`Duplicate widget ID: ${widget.id}`);
            }
            widgetIds.add(widget.id);
            // Valid type
            if (!['metric', 'chart', 'table', 'alert-list'].includes(widget.type)) {
                errors.push(`Invalid widget type: ${widget.type}`);
            }
            // Required fields
            if (!widget.title || !widget.position || !widget.config) {
                errors.push(`Widget ${widget.id} missing required fields`);
            }
            // Position validation
            if (widget.position) {
                const { x, y, w, h } = widget.position;
                if (x < 0 || y < 0 || w <= 0 || h <= 0) {
                    errors.push(`Widget ${widget.id} has invalid position`);
                }
                if (w > 12) {
                    errors.push(`Widget ${widget.id} width exceeds grid (max 12)`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Get available widget types for a role
     */
    getAvailableWidgetTypes(role) {
        const baseTypes = ['metric', 'chart', 'table', 'alert-list'];
        switch (role.toLowerCase()) {
            case 'super_admin':
            case 'admin':
                return [...baseTypes, 'audit-log', 'sync-status'];
            case 'hr':
                return [...baseTypes, 'staff-list'];
            case 'manager':
                return baseTypes.filter(t => t !== 'audit-log');
            default:
                return ['metric', 'alert-list'];
        }
    }
}
exports.default = DashboardCustomizationService;
