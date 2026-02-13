"use strict";
/**
 * Bulk Export Service
 * Handles bulk export of data to CSV/Excel
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
const ExportService_1 = __importDefault(require("../modules/report/services/ExportService"));
const Staff_1 = require("../modules/staff/models/Staff");
const Attendance_1 = require("../modules/attendance/models/Attendance");
const Alert_1 = require("../modules/alert/models/Alert");
const AuditService_1 = __importDefault(require("../modules/audit/services/AuditService"));
class BulkExportService {
    constructor() {
        this.exportService = new ExportService_1.default();
        this.auditService = new AuditService_1.default();
    }
    /**
     * Export all staff to CSV
     */
    exportAllStaff(businessId, filters, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const query = { business: businessId };
            if (filters === null || filters === void 0 ? void 0 : filters.department) {
                query.department = filters.department;
            }
            if (filters === null || filters === void 0 ? void 0 : filters.status) {
                query.isActive = filters.status === 'active';
            }
            if (filters === null || filters === void 0 ? void 0 : filters.role) {
                query.role = filters.role;
            }
            const staff = yield Staff_1.Staff.find(query)
                .populate('department', 'name')
                .populate('business', 'name')
                .sort({ name: 1 });
            // Build CSV
            let csv = 'UID,Name,Email,Phone,Department,Role,Status,Created Date\n';
            for (const s of staff) {
                const staffData = s;
                csv += `"${staffData.uid || ''}",`;
                csv += `"${staffData.name}",`;
                csv += `"${staffData.email || ''}",`;
                csv += `"${staffData.phone || ''}",`;
                csv += `"${((_a = staffData.department) === null || _a === void 0 ? void 0 : _a.name) || ''}",`;
                csv += `"${staffData.role || 'staff'}",`;
                csv += `"${staffData.isActive ? 'Active' : 'Inactive'}",`;
                csv += `"${staffData.createdAt.toISOString()}"\n`;
            }
            // Log export
            if (userId) {
                yield this.auditService.logAsync({
                    action: 'DATA_EXPORT',
                    resource: 'Staff',
                    userId,
                    business: businessId,
                    metadata: {
                        total: staff.length,
                        filters,
                        exportType: 'CSV'
                    },
                    status: 'success'
                });
            }
            return csv;
        });
    }
    /**
     * Export attendance records to CSV
     */
    exportAttendance(businessId, startDate, endDate, filters, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Get staff for business
            const staffQuery = { business: businessId };
            if (filters === null || filters === void 0 ? void 0 : filters.department) {
                staffQuery.department = filters.department;
            }
            const staff = yield Staff_1.Staff.find(staffQuery);
            const staffIds = staff.map(s => s._id);
            // Build attendance query
            const attendanceQuery = {
                staff: { $in: staffIds },
                date: { $gte: startDate, $lte: endDate }
            };
            if (filters === null || filters === void 0 ? void 0 : filters.flaggedOnly) {
                attendanceQuery.flagged = true;
            }
            const attendance = yield Attendance_1.Attendance.find(attendanceQuery)
                .populate('staff', 'name uid')
                .sort({ date: -1, 'staff.name': 1 });
            // Build CSV
            let csv = 'Date,Staff UID,Staff Name,Check In,Check Out,Status,Flagged,Flag Reason\n';
            for (const a of attendance) {
                csv += `"${a.date.toISOString().split('T')[0]}",`;
                csv += `"${((_a = a.staff) === null || _a === void 0 ? void 0 : _a.uid) || ''}",`;
                csv += `"${((_b = a.staff) === null || _b === void 0 ? void 0 : _b.name) || ''}",`;
                csv += `"${a.checkInTime ? a.checkInTime.toLocaleTimeString() : ''}",`;
                csv += `"${a.checkOutTime ? a.checkOutTime.toLocaleTimeString() : ''}",`;
                csv += `"${a.status}",`;
                csv += `"${a.flagged ? 'Yes' : 'No'}",`;
                csv += `"${a.flagReason || ''}"\n`;
            }
            // Log export
            if (userId) {
                yield this.auditService.logAsync({
                    action: 'DATA_EXPORT',
                    resource: 'Attendance',
                    userId,
                    business: businessId,
                    metadata: {
                        total: attendance.length,
                        startDate,
                        endDate,
                        filters,
                        exportType: 'CSV'
                    },
                    status: 'success'
                });
            }
            return csv;
        });
    }
    /**
     * Export alerts to CSV
     */
    exportAlerts(businessId, startDate, endDate, filters, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const query = {
                business: businessId,
                createdAt: { $gte: startDate, $lte: endDate }
            };
            if (filters === null || filters === void 0 ? void 0 : filters.type) {
                query.type = filters.type;
            }
            if (filters === null || filters === void 0 ? void 0 : filters.severity) {
                query.severity = filters.severity;
            }
            if (filters === null || filters === void 0 ? void 0 : filters.status) {
                query.status = filters.status;
            }
            const alerts = yield Alert_1.Alert.find(query)
                .populate('staff', 'name uid')
                .sort({ createdAt: -1 });
            // Build CSV
            let csv = 'Date,Type,Severity,Status,Staff UID,Staff Name,Title,Message,Acknowledged,Resolved\n';
            for (const a of alerts) {
                csv += `"${a.createdAt.toISOString()}",`;
                csv += `"${a.type}",`;
                csv += `"${a.severity}",`;
                csv += `"${a.status}",`;
                csv += `"${((_a = a.staff) === null || _a === void 0 ? void 0 : _a.uid) || ''}",`;
                csv += `"${((_b = a.staff) === null || _b === void 0 ? void 0 : _b.name) || ''}",`;
                csv += `"${a.title}",`;
                csv += `"${a.message}",`;
                csv += `"${a.acknowledged ? 'Yes' : 'No'}",`;
                csv += `"${a.resolved ? 'Yes' : 'No'}"\n`;
            }
            // Log export
            if (userId) {
                yield this.auditService.logAsync({
                    action: 'DATA_EXPORT',
                    resource: 'Alert',
                    userId,
                    business: businessId,
                    metadata: {
                        total: alerts.length,
                        startDate,
                        endDate,
                        filters,
                        exportType: 'CSV'
                    },
                    status: 'success'
                });
            }
            return csv;
        });
    }
    /**
     * Generate filename for export
     */
    generateFilename(type, format = 'csv') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `${type}_export_${timestamp}.${format}`;
    }
    /**
     * Get content type for format
     */
    getContentType(format) {
        switch (format) {
            case 'csv':
                return 'text/csv';
            case 'xlsx':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            default:
                return 'text/plain';
        }
    }
}
exports.default = BulkExportService;
