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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseController_1 = __importDefault(require("../../base/controllers.ts/BaseController"));
const AlertService_1 = __importDefault(require("../services/AlertService"));
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
class AlertController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new AlertService_1.default();
        /**
         * Get all alerts with filters
         * GET /v1/alerts
         */
        this.getAllAlerts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const businessFilter = req.businessFilter;
                const filters = {
                    type: req.query.type,
                    severity: req.query.severity,
                    status: req.query.status,
                    staff: req.query.staff,
                };
                // Apply business scoping
                if (businessFilter) {
                    filters.business = businessFilter;
                }
                // Date range
                if (req.query.startDate) {
                    filters.startDate = new Date(req.query.startDate);
                }
                if (req.query.endDate) {
                    filters.endDate = new Date(req.query.endDate);
                }
                // Acknowledged/resolved filters
                if (req.query.acknowledged !== undefined) {
                    filters.acknowledged = req.query.acknowledged === "true";
                }
                if (req.query.resolved !== undefined) {
                    filters.resolved = req.query.resolved === "true";
                }
                const options = {
                    skip: req.query.skip ? parseInt(req.query.skip) : 0,
                    limit: req.query.limit ? parseInt(req.query.limit) : 50,
                    populate: true,
                };
                const { alerts, total } = yield this.service.getAlerts(filters, options);
                this.sendSuccessResponseList(res, 200, {
                    message: "Alerts retrieved successfully",
                    data: {
                        total,
                        skip: options.skip,
                        limit: options.limit,
                        items: alerts,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get active alerts only
         * GET /v1/alerts/active
         */
        this.getActiveAlerts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const businessFilter = req.businessFilter;
                const alerts = yield this.service.getActiveAlerts(businessFilter);
                this.sendSuccessResponse(res, 200, {
                    message: "Active alerts retrieved successfully",
                    data: {
                        alerts,
                        count: alerts.length,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get alert statistics
         * GET /v1/alerts/stats
         */
        this.getAlertStats = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const businessFilter = req.businessFilter;
                const stats = yield this.service.getAlertStats(businessFilter);
                this.sendSuccessResponse(res, 200, {
                    message: "Alert statistics retrieved successfully",
                    data: stats,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get alert by ID
         * GET /v1/alerts/:id
         */
        this.getAlertById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                const alert = yield this.service.getAlertById(id);
                if (!alert) {
                    throw new NotFoundError_1.default({ error: "Alert not found" });
                }
                // Business scoping check
                const businessFilter = req.businessFilter;
                if (businessFilter && alert.business.toString() !== businessFilter) {
                    throw new BadRequestError_1.default({ error: "Unauthorized access to alert" });
                }
                this.sendSuccessResponse(res, 200, {
                    message: "Alert retrieved successfully",
                    data: alert,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Acknowledge an alert
         * POST /v1/alerts/:id/acknowledge
         */
        this.acknowledgeAlert = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                // First check if alert exists and user has access
                const existingAlert = yield this.service.getAlertById(id);
                if (!existingAlert) {
                    throw new NotFoundError_1.default({ error: "Alert not found" });
                }
                // Business scoping check
                const businessFilter = req.businessFilter;
                if (businessFilter &&
                    existingAlert.business.toString() !== businessFilter) {
                    throw new BadRequestError_1.default({ error: "Unauthorized access to alert" });
                }
                const alert = yield this.service.acknowledgeAlert(id, {
                    userId: user._id.toString(),
                    userName: user.name,
                });
                this.sendSuccessResponse(res, 200, {
                    message: "Alert acknowledged successfully",
                    data: alert,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Resolve an alert
         * POST /v1/alerts/:id/resolve
         */
        this.resolveAlert = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                const { resolutionNotes } = req.body;
                // First check if alert exists and user has access
                const existingAlert = yield this.service.getAlertById(id);
                if (!existingAlert) {
                    throw new NotFoundError_1.default({ error: "Alert not found" });
                }
                // Business scoping check
                const businessFilter = req.businessFilter;
                if (businessFilter &&
                    existingAlert.business.toString() !== businessFilter) {
                    throw new BadRequestError_1.default({ error: "Unauthorized access to alert" });
                }
                const alert = yield this.service.resolveAlert(id, {
                    userId: user._id.toString(),
                    resolutionNotes,
                });
                this.sendSuccessResponse(res, 200, {
                    message: "Alert resolved successfully",
                    data: alert,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Dismiss an alert
         * POST /v1/alerts/:id/dismiss
         */
        this.dismissAlert = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                // First check if alert exists and user has access
                const existingAlert = yield this.service.getAlertById(id);
                if (!existingAlert) {
                    throw new NotFoundError_1.default({ error: "Alert not found" });
                }
                // Business scoping check (only super admin and control room can dismiss)
                if (user.role !== "super-admin" &&
                    user.role !== "control-room") {
                    throw new BadRequestError_1.default({
                        error: "Only Super Admin and Control Room can dismiss alerts",
                    });
                }
                const alert = yield this.service.dismissAlert(id);
                this.sendSuccessResponse(res, 200, {
                    message: "Alert dismissed successfully",
                    data: alert,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get alerts for a specific staff member
         * GET /v1/alerts/staff/:staffId
         */
        this.getStaffAlerts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { staffId } = req.params;
                const activeOnly = req.query.activeOnly === "true";
                const count = yield this.service.getStaffAlertCount(staffId, activeOnly);
                const { alerts, total } = yield this.service.getAlerts({ staff: staffId }, { limit: 50, populate: true });
                this.sendSuccessResponse(res, 200, {
                    message: "Staff alerts retrieved successfully",
                    data: {
                        alerts,
                        total,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = AlertController;
