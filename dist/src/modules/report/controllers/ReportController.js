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
const ReportService_1 = __importDefault(require("../services/ReportService"));
const ExportService_1 = __importDefault(require("../services/ExportService"));
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
class ReportController extends BaseController_1.default {
    constructor() {
        super(...arguments);
        this.service = new ReportService_1.default();
        this.exportService = new ExportService_1.default();
        /**
         * Generate Location Compliance Report
         * GET /v1/reports/location-compliance
         */
        this.getLocationComplianceReport = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate, business, department } = req.query;
                // Validate dates
                if (!startDate || !endDate) {
                    throw new BadRequestError_1.default({
                        error: "startDate and endDate are required",
                    });
                }
                const dateRange = {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                };
                const filter = {};
                const businessFilter = req.businessFilter;
                if (businessFilter) {
                    filter.business = businessFilter;
                }
                else if (business) {
                    filter.business = business;
                }
                if (department)
                    filter.department = department;
                const report = yield this.service.generateLocationComplianceReport(dateRange, filter);
                this.sendSuccessResponse(res, 200, {
                    message: "Location compliance report generated successfully",
                    data: report,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Generate Attendance Anomalies Report
         * GET /v1/reports/attendance-anomalies
         */
        this.getAttendanceAnomaliesReport = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate, business, department } = req.query;
                if (!startDate || !endDate) {
                    throw new BadRequestError_1.default({
                        error: "startDate and endDate are required",
                    });
                }
                const dateRange = {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                };
                const filter = {};
                const businessFilter = req.businessFilter;
                if (businessFilter) {
                    filter.business = businessFilter;
                }
                else if (business) {
                    filter.business = business;
                }
                if (department)
                    filter.department = department;
                const report = yield this.service.generateAttendanceAnomaliesReport(dateRange, filter);
                this.sendSuccessResponse(res, 200, {
                    message: "Attendance anomalies report generated successfully",
                    data: report,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Generate Late Check-ins Report
         * GET /v1/reports/late-checkins
         */
        this.getLateCheckinsReport = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate, business, department, threshold } = req.query;
                if (!startDate || !endDate) {
                    throw new BadRequestError_1.default({
                        error: "startDate and endDate are required",
                    });
                }
                const dateRange = {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                };
                const filter = {};
                const businessFilter = req.businessFilter;
                if (businessFilter) {
                    filter.business = businessFilter;
                }
                else if (business) {
                    filter.business = business;
                }
                if (department)
                    filter.department = department;
                if (threshold)
                    filter.thresholdMinutes = parseInt(threshold);
                const report = yield this.service.generateLateCheckinsReport(dateRange, filter);
                this.sendSuccessResponse(res, 200, {
                    message: "Late check-ins report generated successfully",
                    data: report,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Generate Alert Summary Report
         * GET /v1/reports/alert-summary
         */
        this.getAlertSummaryReport = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate, business } = req.query;
                if (!startDate || !endDate) {
                    throw new BadRequestError_1.default({
                        error: "startDate and endDate are required",
                    });
                }
                const dateRange = {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                };
                const filter = {};
                const businessFilter = req.businessFilter;
                if (businessFilter) {
                    filter.business = businessFilter;
                }
                else if (business) {
                    filter.business = business;
                }
                const report = yield this.service.generateAlertSummaryReport(dateRange, filter);
                this.sendSuccessResponse(res, 200, {
                    message: "Alert summary report generated successfully",
                    data: report,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Generate Dashboard Report (all metrics combined)
         * GET /v1/reports/dashboard
         */
        this.getDashboardReport = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate, business } = req.query;
                if (!startDate || !endDate) {
                    throw new BadRequestError_1.default({
                        error: "startDate and endDate are required",
                    });
                }
                const dateRange = {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                };
                const filter = {};
                const businessFilter = req.businessFilter;
                if (businessFilter) {
                    filter.business = businessFilter;
                }
                else if (business) {
                    filter.business = business;
                }
                const report = yield this.service.generateDashboardReport(dateRange, filter);
                this.sendSuccessResponse(res, 200, {
                    message: "Dashboard report generated successfully",
                    data: report,
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Export any report to various formats
         * POST /v1/reports/export
         */
        this.exportReport = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { reportData, format } = req.body;
                if (!reportData) {
                    throw new BadRequestError_1.default({
                        error: "reportData is required in request body",
                    });
                }
                const exportFormat = (format || "csv").toLowerCase();
                let exportedData;
                let contentType;
                let filename;
                switch (exportFormat) {
                    case "csv":
                        exportedData = this.exportService.exportToCSV(reportData);
                        contentType = this.exportService.getContentType("csv");
                        filename = this.exportService.generateFilename(reportData.reportType || "report", "csv");
                        break;
                    case "json":
                        exportedData = this.exportService.exportToJSON(reportData);
                        contentType = this.exportService.getContentType("json");
                        filename = this.exportService.generateFilename(reportData.reportType || "report", "json");
                        break;
                    case "pdf":
                        // PHASE 5: PDF export now fully implemented (async)
                        exportedData = yield this.exportService.exportToPDF(reportData);
                        contentType = this.exportService.getContentType("pdf");
                        filename = this.exportService.generateFilename(reportData.reportType || "report", "pdf");
                        break;
                    default:
                        throw new BadRequestError_1.default({
                            error: "Invalid format. Supported: csv, json, pdf",
                        });
                }
                // Set headers for file download
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
exports.default = ReportController;
