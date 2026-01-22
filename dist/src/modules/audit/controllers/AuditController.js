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
const AuditService_1 = __importDefault(require("../services/AuditService"));
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
class AuditController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new AuditService_1.default();
        /**
         * Get audit logs with filters
         * GET /v1/audit/logs
         */
        this.getLogs = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, resource, resourceId, action, business, status, startDate, endDate, skip, limit, } = req.query;
                const filter = {};
                if (userId)
                    filter.userId = userId;
                if (resource)
                    filter.resource = resource;
                if (resourceId)
                    filter.resourceId = resourceId;
                if (action)
                    filter.action = action;
                if (business)
                    filter.business = business;
                if (status)
                    filter.status = status;
                if (startDate)
                    filter.startDate = new Date(startDate);
                if (endDate)
                    filter.endDate = new Date(endDate);
                const options = {
                    skip: skip ? parseInt(skip) : 0,
                    limit: limit ? parseInt(limit) : 50,
                };
                const { logs, total } = yield this.service.query(filter, options);
                this.sendSuccessResponseList(res, 200, {
                    message: "Audit logs retrieved successfully",
                    data: {
                        total,
                        skip: options.skip,
                        limit: options.limit,
                        items: logs,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get single audit log by ID
         * GET /v1/audit/logs/:id
         */
        this.getLogById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const log = yield this.service.getById(id);
                if (!log) {
                    throw new NotFoundError_1.default({ error: "Audit log not found" });
                }
                this.sendSuccessResponse(res, 200, {
                    message: "Audit log retrieved successfully",
                    data: log,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get logs for specific user
         * GET /v1/audit/users/:userId
         */
        this.getUserLogs = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const { skip, limit } = req.query;
                const options = {
                    skip: skip ? parseInt(skip) : 0,
                    limit: limit ? parseInt(limit) : 50,
                };
                const { logs, total } = yield this.service.getUserLogs(userId, options);
                this.sendSuccessResponseList(res, 200, {
                    message: "User audit logs retrieved successfully",
                    data: {
                        total,
                        skip: options.skip,
                        limit: options.limit,
                        items: logs,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get logs for specific resource
         * GET /v1/audit/resources/:type/:id
         */
        this.getResourceLogs = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { type, id } = req.params;
                const { skip, limit } = req.query;
                const options = {
                    skip: skip ? parseInt(skip) : 0,
                    limit: limit ? parseInt(limit) : 50,
                };
                const { logs, total } = yield this.service.getResourceLogs(type, id, options);
                this.sendSuccessResponseList(res, 200, {
                    message: "Resource audit logs retrieved successfully",
                    data: {
                        total,
                        skip: options.skip,
                        limit: options.limit,
                        items: logs,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get audit statistics
         * GET /v1/audit/stats
         */
        this.getStatistics = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, business, startDate, endDate } = req.query;
                const filter = {};
                if (userId)
                    filter.userId = userId;
                if (business)
                    filter.business = business;
                if (startDate)
                    filter.startDate = new Date(startDate);
                if (endDate)
                    filter.endDate = new Date(endDate);
                const stats = yield this.service.getStatistics(filter);
                this.sendSuccessResponse(res, 200, {
                    message: "Audit statistics retrieved successfully",
                    data: stats,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Get recent activity
         * GET /v1/audit/recent
         */
        this.getRecentActivity = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { limit } = req.query;
                const logs = yield this.service.getRecentActivity(limit ? parseInt(limit) : 100);
                this.sendSuccessResponse(res, 200, {
                    message: "Recent activity retrieved successfully",
                    data: logs,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Search audit logs
         * GET /v1/audit/search
         */
        this.searchLogs = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { q, skip, limit } = req.query;
                if (!q) {
                    throw new BadRequestError_1.default({ error: "Search query 'q' is required" });
                }
                const options = {
                    skip: skip ? parseInt(skip) : 0,
                    limit: limit ? parseInt(limit) : 50,
                };
                const { logs, total } = yield this.service.search(q, options);
                this.sendSuccessResponseList(res, 200, {
                    message: "Audit logs search completed successfully",
                    data: {
                        total,
                        skip: options.skip,
                        limit: options.limit,
                        items: logs,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Export audit logs
         * POST /v1/audit/export
         */
        this.exportLogs = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { format, filter } = req.body;
                if (!format) {
                    throw new BadRequestError_1.default({ error: "Export format is required" });
                }
                // Get logs based on filter
                const { logs } = yield this.service.query(filter || {}, { limit: 10000 });
                let exportedData;
                let contentType;
                let filename;
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                switch (format.toLowerCase()) {
                    case "csv":
                        exportedData = this.service.exportToCSV(logs);
                        contentType = "text/csv";
                        filename = `audit_logs_${timestamp}.csv`;
                        break;
                    case "json":
                        exportedData = this.service.exportToJSON(logs);
                        contentType = "application/json";
                        filename = `audit_logs_${timestamp}.json`;
                        break;
                    default:
                        throw new BadRequestError_1.default({
                            error: "Invalid format. Supported: csv, json",
                        });
                }
                res.setHeader("Content-Type", contentType);
                res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
                res.send(exportedData);
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = AuditController;
