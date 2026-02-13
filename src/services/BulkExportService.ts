/**
 * Bulk Export Service
 * Handles bulk export of data to CSV/Excel
 * Phase 6: Admin Dashboard Enhancements
 */

import ExportService from '../modules/report/services/ExportService';
import { Staff } from '../modules/staff/models/Staff';
import { Attendance } from '../modules/attendance/models/Attendance';
import { Alert } from '../modules/alert/models/Alert';
import AuditService from '../modules/audit/services/AuditService';

export default class BulkExportService {
  private exportService: ExportService;
  private auditService: AuditService;

  constructor() {
    this.exportService = new ExportService();
    this.auditService = new AuditService();
  }

  /**
   * Export all staff to CSV
   */
  async exportAllStaff(
    businessId: string,
    filters?: {
      department?: string;
      status?: 'active' | 'inactive';
      role?: string;
    },
    userId?: string
  ): Promise<string> {
    const query: any = { business: businessId };

    if (filters?.department) {
      query.department = filters.department;
    }

    if (filters?.status) {
      query.isActive = filters.status === 'active';
    }

    if (filters?.role) {
      query.role = filters.role;
    }

    const staff = await Staff.find(query)
      .populate('department', 'name')
      .populate('business', 'name')
      .sort({ name: 1 });

    // Build CSV
    let csv = 'UID,Name,Email,Phone,Department,Role,Status,Created Date\n';

    for (const s of staff) {
      const staffData = s as any;
      csv += `"${staffData.uid || ''}",`;
      csv += `"${staffData.name}",`;
      csv += `"${staffData.email || ''}",`;
      csv += `"${staffData.phone || ''}",`;
      csv += `"${staffData.department?.name || ''}",`;
      csv += `"${staffData.role || 'staff'}",`;
      csv += `"${staffData.isActive ? 'Active' : 'Inactive'}",`;
      csv += `"${staffData.createdAt.toISOString()}"\n`;
    }

    // Log export
    if (userId) {
      await this.auditService.logAsync({
        action: 'DATA_EXPORT' as any,
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
  }

  /**
   * Export attendance records to CSV
   */
  async exportAttendance(
    businessId: string,
    startDate: Date,
    endDate: Date,
    filters?: {
      department?: string;
      flaggedOnly?: boolean;
    },
    userId?: string
  ): Promise<string> {
    // Get staff for business
    const staffQuery: any = { business: businessId };
    if (filters?.department) {
      staffQuery.department = filters.department;
    }

    const staff = await Staff.find(staffQuery);
    const staffIds = staff.map(s => s._id);

    // Build attendance query
    const attendanceQuery: any = {
      staff: { $in: staffIds },
      date: { $gte: startDate, $lte: endDate }
    };

    if (filters?.flaggedOnly) {
      attendanceQuery.flagged = true;
    }

    const attendance = await Attendance.find(attendanceQuery)
      .populate('staff', 'name uid')
      .sort({ date: -1, 'staff.name': 1 });

    // Build CSV
    let csv = 'Date,Staff UID,Staff Name,Check In,Check Out,Status,Flagged,Flag Reason\n';

    for (const a of attendance) {
      csv += `"${a.date.toISOString().split('T')[0]}",`;
      csv += `"${(a.staff as any)?.uid || ''}",`;
      csv += `"${(a.staff as any)?.name || ''}",`;
      csv += `"${a.checkInTime ? a.checkInTime.toLocaleTimeString() : ''}",`;
      csv += `"${a.checkOutTime ? a.checkOutTime.toLocaleTimeString() : ''}",`;
      csv += `"${a.status}",`;
      csv += `"${a.flagged ? 'Yes' : 'No'}",`;
      csv += `"${a.flagReason || ''}"\n`;
    }

    // Log export
    if (userId) {
      await this.auditService.logAsync({
        action: 'DATA_EXPORT' as any,
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
  }

  /**
   * Export alerts to CSV
   */
  async exportAlerts(
    businessId: string,
    startDate: Date,
    endDate: Date,
    filters?: {
      type?: string;
      severity?: string;
      status?: string;
    },
    userId?: string
  ): Promise<string> {
    const query: any = {
      business: businessId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.severity) {
      query.severity = filters.severity;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    const alerts = await Alert.find(query)
      .populate('staff', 'name uid')
      .sort({ createdAt: -1 });

    // Build CSV
    let csv = 'Date,Type,Severity,Status,Staff UID,Staff Name,Title,Message,Acknowledged,Resolved\n';

    for (const a of alerts) {
      csv += `"${a.createdAt.toISOString()}",`;
      csv += `"${a.type}",`;
      csv += `"${a.severity}",`;
      csv += `"${a.status}",`;
      csv += `"${(a.staff as any)?.uid || ''}",`;
      csv += `"${(a.staff as any)?.name || ''}",`;
      csv += `"${a.title}",`;
      csv += `"${a.message}",`;
      csv += `"${a.acknowledged ? 'Yes' : 'No'}",`;
      csv += `"${a.resolved ? 'Yes' : 'No'}"\n`;
    }

    // Log export
    if (userId) {
      await this.auditService.logAsync({
        action: 'DATA_EXPORT' as any,
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
  }

  /**
   * Generate filename for export
   */
  generateFilename(type: string, format: 'csv' | 'xlsx' = 'csv'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${type}_export_${timestamp}.${format}`;
  }

  /**
   * Get content type for format
   */
  getContentType(format: 'csv' | 'xlsx'): string {
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
