"use strict";
/**
 * Dashboard Controller
 * Handles analytics, bulk operations, and custom reports
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
const AnalyticsService_1 = __importDefault(require("../../../services/AnalyticsService"));
const BulkImportService_1 = __importDefault(require("../../../services/BulkImportService"));
const BulkExportService_1 = __importDefault(require("../../../services/BulkExportService"));
const CustomReportBuilderService_1 = __importDefault(require("../../../services/CustomReportBuilderService"));
const DashboardCustomizationService_1 = __importDefault(require("../../../services/DashboardCustomizationService"));
class DashboardController {
    constructor() {
        this.analyticsService = new AnalyticsService_1.default();
        this.bulkImportService = new BulkImportService_1.default();
        this.bulkExportService = new BulkExportService_1.default();
        this.customReportService = new CustomReportBuilderService_1.default();
        this.customizationService = new DashboardCustomizationService_1.default();
    }
    /**
     * Get dashboard analytics metrics
     * GET /api/dashboard/analytics
     */
    getAnalytics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const businessId = req.user.business;
                const { startDate, endDate } = req.query;
                const dateRange = startDate && endDate
                    ? { startDate: new Date(startDate), endDate: new Date(endDate) }
                    : undefined;
                const metrics = yield this.analyticsService.getDashboardMetrics(businessId, dateRange);
                res.json({
                    success: true,
                    data: metrics,
                    cached: true // 1-minute cache
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Get trend data for charts
     * GET /api/dashboard/trends/:metric
     */
    getTrendData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const businessId = req.user.business;
                const { metric } = req.params;
                const { days = '7' } = req.query;
                if (!['attendance', 'alerts', 'activities'].includes(metric)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid metric. Must be: attendance, alerts, or activities'
                    });
                }
                const trendData = yield this.analyticsService.getTrendData(businessId, metric, parseInt(days));
                res.json({
                    success: true,
                    data: trendData
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Import staff from CSV
     * POST /api/dashboard/bulk/import/staff
     */
    importStaff(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const businessId = req.user.business;
                const userId = req.user._id;
                if (!req.file && !req.body.csv) {
                    return res.status(400).json({
                        success: false,
                        error: 'CSV file or content is required'
                    });
                }
                const csvContent = req.file ? req.file.buffer : req.body.csv;
                const result = yield this.bulkImportService.importStaffFromCSV(csvContent, businessId, userId);
                res.json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Get CSV template for staff import
     * GET /api/dashboard/bulk/import/template
     */
    getImportTemplate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const template = this.bulkImportService.getCSVTemplate();
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=staff_import_template.csv');
                res.send(template);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Export all staff to CSV
     * GET /api/dashboard/bulk/export/staff
     */
    exportStaff(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const businessId = req.user.business;
                const userId = req.user._id;
                const { department, status, role } = req.query;
                const filters = {};
                if (department)
                    filters.department = department;
                if (status)
                    filters.status = status;
                if (role)
                    filters.role = role;
                const csv = yield this.bulkExportService.exportAllStaff(businessId, filters, userId);
                const filename = this.bulkExportService.generateFilename('staff', 'csv');
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
                res.send(csv);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Export attendance records to CSV
     * GET /api/dashboard/bulk/export/attendance
     */
    exportAttendance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const businessId = req.user.business;
                const userId = req.user._id;
                const { startDate, endDate, department, flaggedOnly } = req.query;
                if (!startDate || !endDate) {
                    return res.status(400).json({
                        success: false,
                        error: 'startDate and endDate are required'
                    });
                }
                const filters = {};
                if (department)
                    filters.department = department;
                if (flaggedOnly === 'true')
                    filters.flaggedOnly = true;
                const csv = yield this.bulkExportService.exportAttendance(businessId, new Date(startDate), new Date(endDate), filters, userId);
                const filename = this.bulkExportService.generateFilename('attendance', 'csv');
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
                res.send(csv);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Export alerts to CSV
     * GET /api/dashboard/bulk/export/alerts
     */
    exportAlerts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const businessId = req.user.business;
                const userId = req.user._id;
                const { startDate, endDate, type, severity, status } = req.query;
                if (!startDate || !endDate) {
                    return res.status(400).json({
                        success: false,
                        error: 'startDate and endDate are required'
                    });
                }
                const filters = {};
                if (type)
                    filters.type = type;
                if (severity)
                    filters.severity = severity;
                if (status)
                    filters.status = status;
                const csv = yield this.bulkExportService.exportAlerts(businessId, new Date(startDate), new Date(endDate), filters, userId);
                const filename = this.bulkExportService.generateFilename('alerts', 'csv');
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
                res.send(csv);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Build custom report
     * POST /api/dashboard/reports/custom
     */
    buildCustomReport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const businessId = req.user.business;
                const config = req.body;
                // Validate config
                const validation = this.customReportService.validateConfig(config);
                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        errors: validation.errors
                    });
                }
                const report = yield this.customReportService.buildCustomReport(config, businessId);
                res.json({
                    success: true,
                    data: report
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Export custom report to CSV
     * POST /api/dashboard/reports/custom/export
     */
    exportCustomReport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const businessId = req.user.business;
                const config = req.body;
                // Build report
                const report = yield this.customReportService.buildCustomReport(config, businessId);
                // Export to CSV
                const csv = yield this.customReportService.exportToCSV(report);
                const filename = `${config.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
                res.send(csv);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Save custom report configuration
     * POST /api/dashboard/reports/save
     */
    saveReportConfig(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user._id;
                const config = req.body;
                // Validate config
                const validation = this.customReportService.validateConfig(config);
                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        errors: validation.errors
                    });
                }
                yield this.customReportService.saveReportConfig(config, userId);
                res.json({
                    success: true,
                    message: 'Report configuration saved'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Get saved report configurations
     * GET /api/dashboard/reports/saved
     */
    getSavedReports(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user._id;
                const configs = yield this.customReportService.getSavedConfigs(userId);
                res.json({
                    success: true,
                    data: configs
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Get available fields for a report type
     * GET /api/dashboard/reports/fields/:type
     */
    getAvailableFields(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { type } = req.params;
                const fields = this.customReportService.getAvailableFields(type);
                res.json({
                    success: true,
                    data: fields
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Get dashboard layout for user
     * GET /api/dashboard/layout
     */
    getLayout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user._id;
                const role = req.user.role;
                const layout = yield this.customizationService.getLayoutForUser(userId, role);
                res.json({
                    success: true,
                    data: layout
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Save dashboard layout customizations
     * POST /api/dashboard/layout
     */
    saveLayout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user._id;
                const role = req.user.role;
                const { widgets } = req.body;
                if (!widgets || !Array.isArray(widgets)) {
                    return res.status(400).json({
                        success: false,
                        error: 'widgets array is required'
                    });
                }
                const layout = yield this.customizationService.saveUserCustomizations(userId, role, widgets);
                res.json({
                    success: true,
                    data: layout
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Reset dashboard layout to default
     * POST /api/dashboard/layout/reset
     */
    resetLayout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user._id;
                const role = req.user.role;
                const layout = yield this.customizationService.resetToDefault(userId, role);
                res.json({
                    success: true,
                    data: layout
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    /**
     * Get available widget types for user role
     * GET /api/dashboard/widgets/available
     */
    getAvailableWidgets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const role = req.user.role;
                const widgetTypes = this.customizationService.getAvailableWidgetTypes(role);
                res.json({
                    success: true,
                    data: widgetTypes
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
}
exports.default = DashboardController;
