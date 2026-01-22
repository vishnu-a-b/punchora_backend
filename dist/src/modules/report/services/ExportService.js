"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pdfkit_1 = __importDefault(require("pdfkit"));
const PDFTemplate_1 = require("../../../templates/PDFTemplate");
/**
 * Export Service
 *
 * Provides export functionality for reports in various formats (CSV, JSON, PDF).
 * PHASE 5: Complete PDF export implementation
 */
class ExportService {
    /**
     * Export report data to CSV format
     */
    exportToCSV(reportData) {
        const reportType = reportData.reportType;
        switch (reportType) {
            case "location_compliance":
                return this.exportLocationComplianceToCSV(reportData);
            case "attendance_anomalies":
                return this.exportAttendanceAnomaliesToCSV(reportData);
            case "late_checkins":
                return this.exportLateCheckinsToCSV(reportData);
            case "alert_summary":
                return this.exportAlertSummaryToCSV(reportData);
            default:
                return this.exportGenericToCSV(reportData);
        }
    }
    /**
     * Export location compliance report to CSV
     */
    exportLocationComplianceToCSV(report) {
        let csv = "Staff Name,Staff UID,Business,Department,Has Location Data,Last Location,Mocked GPS Count,Location Accuracy\n";
        report.details.forEach((staff) => {
            csv += `"${staff.staffName}",${staff.staffUid || ""},"${staff.business || ""}","${staff.department || ""}",`;
            csv += `${staff.hasLocationData ? "Yes" : "No"},`;
            csv += `${staff.lastLocationTimestamp ? new Date(staff.lastLocationTimestamp).toISOString() : "Never"},`;
            csv += `${staff.mockedGPSCount},${staff.locationAccuracy}\n`;
        });
        return csv;
    }
    /**
     * Export attendance anomalies report to CSV
     */
    exportAttendanceAnomaliesToCSV(report) {
        let csv = "Date,Staff Name,Staff UID,Business,Department,Check In,Check Out,Anomalies,Flagged,Flag Status\n";
        report.anomalies.forEach((anomaly) => {
            csv += `${new Date(anomaly.date).toLocaleDateString()},`;
            csv += `"${anomaly.staff.name}",${anomaly.staff.uid || ""},"${anomaly.business || ""}","${anomaly.department || ""}",`;
            csv += `${anomaly.checkInTime ? new Date(anomaly.checkInTime).toLocaleTimeString() : ""},`;
            csv += `${anomaly.checkOutTime ? new Date(anomaly.checkOutTime).toLocaleTimeString() : ""},`;
            csv += `"${anomaly.anomalies.join("; ")}",`;
            csv += `${anomaly.flagged ? "Yes" : "No"},${anomaly.flagStatus || ""}\n`;
        });
        return csv;
    }
    /**
     * Export late check-ins report to CSV
     */
    exportLateCheckinsToCSV(report) {
        let csv = "Date,Staff Name,Staff UID,Business,Department,Expected Time,Actual Time,Minutes Late,Latitude,Longitude\n";
        report.lateCheckIns.forEach((record) => {
            var _a, _b;
            csv += `${new Date(record.date).toLocaleDateString()},`;
            csv += `"${record.staff.name}",${record.staff.uid || ""},"${record.business || ""}","${record.department || ""}",`;
            csv += `${new Date(record.expectedTime).toLocaleTimeString()},`;
            csv += `${new Date(record.actualCheckInTime).toLocaleTimeString()},`;
            csv += `${record.minutesLate},`;
            csv += `${((_a = record.location) === null || _a === void 0 ? void 0 : _a.latitude) || ""},${((_b = record.location) === null || _b === void 0 ? void 0 : _b.longitude) || ""}\n`;
        });
        return csv;
    }
    /**
     * Export alert summary report to CSV
     */
    exportAlertSummaryToCSV(report) {
        // For alert summary, export the top staff with alerts
        let csv = "Staff Name,Staff UID,Alert Count\n";
        report.topStaffWithAlerts.forEach((staff) => {
            csv += `"${staff.staffName}",${staff.staffUid || ""},${staff.count}\n`;
        });
        csv += "\n\nAlert Type Breakdown\n";
        csv += "Type,Count\n";
        Object.entries(report.breakdown.byType).forEach(([type, count]) => {
            csv += `${type},${count}\n`;
        });
        return csv;
    }
    /**
     * Export generic report to CSV (fallback)
     */
    exportGenericToCSV(report) {
        // Convert report to JSON and then to CSV
        let csv = "Report Data\n";
        csv += JSON.stringify(report, null, 2);
        return csv;
    }
    /**
     * Export report to JSON (formatted)
     */
    exportToJSON(reportData) {
        return JSON.stringify(reportData, null, 2);
    }
    /**
     * Generate filename for export
     */
    generateFilename(reportType, format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        return `${reportType}_${timestamp}.${format}`;
    }
    /**
     * Get content type for format
     */
    getContentType(format) {
        switch (format) {
            case "csv":
                return "text/csv";
            case "json":
                return "application/json";
            case "pdf":
                return "application/pdf";
            default:
                return "text/plain";
        }
    }
    /**
     * Export to PDF
     * PHASE 5: Full implementation complete
     */
    exportToPDF(reportData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({ size: "A4", margin: 50 });
                const template = new PDFTemplate_1.PDFTemplate(doc);
                const chunks = [];
                // Collect PDF chunks
                doc.on("data", (chunk) => chunks.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(chunks)));
                doc.on("error", reject);
                // Route to appropriate PDF generator based on report type
                const reportType = reportData.reportType;
                switch (reportType) {
                    case "location_compliance":
                        this.generateLocationCompliancePDF(doc, template, reportData);
                        break;
                    case "attendance_anomalies":
                        this.generateAttendanceAnomaliesPDF(doc, template, reportData);
                        break;
                    case "late_checkins":
                        this.generateLateCheckinsPDF(doc, template, reportData);
                        break;
                    case "alert_summary":
                        this.generateAlertSummaryPDF(doc, template, reportData);
                        break;
                    case "dashboard":
                        this.generateDashboardPDF(doc, template, reportData);
                        break;
                    default:
                        this.generateGenericPDF(doc, template, reportData);
                }
                // Finalize PDF
                template.finalize();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Generate Location Compliance Report PDF
     */
    generateLocationCompliancePDF(_doc, template, report) {
        // Header
        template.addHeader("Location Compliance Report", `${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`);
        // Summary
        template.addSummaryBox([
            { label: "Total Staff", value: report.summary.totalStaff },
            {
                label: "With Location Data",
                value: report.summary.staffWithLocationData,
            },
            {
                label: "Compliance Rate",
                value: `${report.summary.complianceRate}%`,
            },
            {
                label: "Mocked GPS Detected",
                value: report.summary.mockedGPSCount || 0,
            },
        ]);
        // Section heading
        template.addSectionHeading("Staff Location Details");
        // Table
        const columns = [
            { header: "Staff", width: 20 },
            { header: "UID", width: 10, align: "center" },
            { header: "Business", width: 15 },
            { header: "Department", width: 15 },
            { header: "Has Location", width: 12, align: "center" },
            { header: "Last Location", width: 15 },
            { header: "Mocked GPS", width: 13, align: "center" },
        ];
        const rows = report.details.map((staff) => [
            staff.staffName,
            staff.staffUid || "",
            staff.business || "",
            staff.department || "",
            staff.hasLocationData ? "Yes" : "No",
            staff.lastLocationTimestamp
                ? new Date(staff.lastLocationTimestamp).toLocaleDateString()
                : "Never",
            staff.mockedGPSCount || 0,
        ]);
        template.addTable(columns, rows);
    }
    /**
     * Generate Attendance Anomalies Report PDF
     */
    generateAttendanceAnomaliesPDF(_doc, template, report) {
        // Header
        template.addHeader("Attendance Anomalies Report", `${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`);
        // Summary
        template.addSummaryBox([
            { label: "Total Anomalies", value: report.summary.totalAnomalies },
            { label: "Flagged Records", value: report.summary.flaggedCount },
            { label: "Reviewed", value: report.summary.reviewedCount || 0 },
            { label: "Pending Review", value: report.summary.pendingReview || 0 },
        ]);
        // Section heading
        template.addSectionHeading("Anomaly Details");
        // Table
        const columns = [
            { header: "Date", width: 12 },
            { header: "Staff", width: 18 },
            { header: "UID", width: 8, align: "center" },
            { header: "Department", width: 15 },
            { header: "Check In", width: 12, align: "center" },
            { header: "Check Out", width: 12, align: "center" },
            { header: "Anomalies", width: 23 },
        ];
        const rows = report.anomalies.map((anomaly) => [
            new Date(anomaly.date).toLocaleDateString(),
            anomaly.staff.name,
            anomaly.staff.uid || "",
            anomaly.department || "",
            anomaly.checkInTime
                ? new Date(anomaly.checkInTime).toLocaleTimeString()
                : "",
            anomaly.checkOutTime
                ? new Date(anomaly.checkOutTime).toLocaleTimeString()
                : "",
            anomaly.anomalies.join(", "),
        ]);
        template.addTable(columns, rows);
    }
    /**
     * Generate Late Check-ins Report PDF
     */
    generateLateCheckinsPDF(_doc, template, report) {
        // Header
        template.addHeader("Late Check-ins Report", `${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`);
        // Summary
        template.addSummaryBox([
            {
                label: "Total Late Check-ins",
                value: report.summary.totalLateCheckins,
            },
            {
                label: "Average Delay",
                value: `${report.summary.averageDelay || 0} min`,
            },
            {
                label: "Unique Staff",
                value: report.summary.uniqueStaff || 0,
            },
            {
                label: "Max Delay",
                value: `${report.summary.maxDelay || 0} min`,
            },
        ]);
        // Section heading
        template.addSectionHeading("Late Check-in Records");
        // Table
        const columns = [
            { header: "Date", width: 12 },
            { header: "Staff", width: 20 },
            { header: "UID", width: 8, align: "center" },
            { header: "Department", width: 15 },
            { header: "Expected", width: 12, align: "center" },
            { header: "Actual", width: 12, align: "center" },
            { header: "Delay (min)", width: 11, align: "right" },
            { header: "Location", width: 10, align: "center" },
        ];
        const rows = report.lateCheckIns.map((record) => {
            var _a;
            return [
                new Date(record.date).toLocaleDateString(),
                record.staff.name,
                record.staff.uid || "",
                record.department || "",
                new Date(record.expectedTime).toLocaleTimeString(),
                new Date(record.actualCheckInTime).toLocaleTimeString(),
                record.minutesLate,
                ((_a = record.location) === null || _a === void 0 ? void 0 : _a.latitude) ? "Yes" : "No",
            ];
        });
        template.addTable(columns, rows);
    }
    /**
     * Generate Alert Summary Report PDF
     */
    generateAlertSummaryPDF(_doc, template, report) {
        // Header
        template.addHeader("Alert Summary Report", `${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`);
        // Summary
        template.addSummaryBox([
            { label: "Total Alerts", value: report.summary.totalAlerts },
            { label: "Active Alerts", value: report.summary.activeAlerts },
            { label: "Resolved", value: report.summary.resolvedAlerts },
            { label: "Critical", value: report.summary.criticalAlerts || 0 },
        ]);
        // Alert Type Breakdown
        template.addSectionHeading("Alert Type Breakdown");
        const typeColumns = [
            { header: "Alert Type", width: 40 },
            { header: "Count", width: 30, align: "center" },
            { header: "Percentage", width: 30, align: "right" },
        ];
        const typeRows = Object.entries(report.breakdown.byType).map(([type, count]) => [
            type,
            count,
            `${((count / report.summary.totalAlerts) * 100).toFixed(1)}%`,
        ]);
        template.addTable(typeColumns, typeRows);
        // Top Staff with Alerts
        if (report.topStaffWithAlerts &&
            report.topStaffWithAlerts.length > 0) {
            template.addSectionHeading("Top Staff with Alerts");
            const staffColumns = [
                { header: "Staff Name", width: 40 },
                { header: "UID", width: 20, align: "center" },
                { header: "Alert Count", width: 40, align: "right" },
            ];
            const staffRows = report.topStaffWithAlerts
                .slice(0, 10)
                .map((staff) => [
                staff.staffName,
                staff.staffUid || "",
                staff.count,
            ]);
            template.addTable(staffColumns, staffRows);
        }
    }
    /**
     * Generate Dashboard Summary PDF
     */
    generateDashboardPDF(_doc, template, report) {
        // Header
        template.addHeader("Dashboard Summary Report", `${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`);
        // Summary metrics
        template.addSummaryBox([
            { label: "Total Alerts", value: report.alerts.totalAlerts },
            { label: "Active Alerts", value: report.alerts.activeAlerts },
            { label: "Total Anomalies", value: report.anomalies.totalAnomalies },
            { label: "Flagged Records", value: report.anomalies.flaggedCount },
        ]);
        // Recent Alerts section
        if (report.alerts.recentAlerts && report.alerts.recentAlerts.length > 0) {
            template.addSectionHeading("Recent Alerts");
            const alertColumns = [
                { header: "Type", width: 20 },
                { header: "Staff", width: 25 },
                { header: "Severity", width: 15, align: "center" },
                { header: "Status", width: 15, align: "center" },
                { header: "Created", width: 25 },
            ];
            const alertRows = report.alerts.recentAlerts
                .slice(0, 10)
                .map((alert) => {
                var _a;
                return [
                    alert.type,
                    ((_a = alert.staff) === null || _a === void 0 ? void 0 : _a.name) || "N/A",
                    alert.severity,
                    alert.status,
                    new Date(alert.createdAt).toLocaleString(),
                ];
            });
            template.addTable(alertColumns, alertRows);
        }
        // Attendance summary
        if (report.attendance) {
            template.addSectionHeading("Attendance Overview");
            template.addKeyValueList([
                {
                    key: "Total Records",
                    value: String(report.attendance.totalRecords || 0),
                },
                {
                    key: "Present Today",
                    value: String(report.attendance.presentToday || 0),
                },
                {
                    key: "Late Check-ins",
                    value: String(report.attendance.lateCheckins || 0),
                },
            ]);
        }
    }
    /**
     * Generate generic PDF (fallback)
     */
    generateGenericPDF(doc, template, report) {
        template.addHeader("Report", "Generated Report");
        template.addParagraph("Report Data:");
        // Format JSON nicely
        const jsonStr = JSON.stringify(report, null, 2);
        const lines = jsonStr.split("\n");
        lines.forEach((line) => {
            if (template.needsPageBreak(15)) {
                template.addPageBreak();
            }
            doc.fontSize(8).fillColor("#000000").text(line, 50, doc.y);
            doc.y += 12;
        });
    }
}
exports.default = ExportService;
