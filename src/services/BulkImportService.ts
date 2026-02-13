/**
 * Bulk Import Service
 * Handles CSV import of staff data
 * Phase 6: Admin Dashboard Enhancements
 */

import csv from 'csv-parser';
import { Readable } from 'stream';
import { Staff } from '../modules/staff/models/Staff';
import AuditService from '../modules/audit/services/AuditService';

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: { row: number; error: string; data?: any }[];
  imported: any[];
}

export default class BulkImportService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Import staff from CSV file
   */
  async importStaffFromCSV(
    csvContent: string | Buffer,
    businessId: string,
    userId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
      imported: []
    };

    const records: any[] = [];

    // Parse CSV
    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from([csvContent]);

      stream
        .pipe(csv())
        .on('data', (data) => {
          records.push(data);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    result.total = records.length;

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 for header row and 0-index

      try {
        // Validate required fields
        const validation = this.validateStaffRecord(record);
        if (!validation.valid) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: validation.errors.join(', '),
            data: record
          });
          continue;
        }

        // Transform CSV data to Staff model format
        const staffData = this.transformToStaffData(record, businessId);

        // Check for existing staff with same UID
        const existing = await Staff.findOne({
          business: businessId,
          uid: staffData.uid
        });

        if (existing) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: `Staff with UID ${staffData.uid} already exists`,
            data: record
          });
          continue;
        }

        // Create staff
        const staff = await Staff.create(staffData);
        result.successful++;
        result.imported.push(staff);

      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error',
          data: record
        });
      }
    }

    // Log to audit
    await this.auditService.logAsync({
      action: 'DATA_IMPORT' as any,
      resource: 'Staff',
      userId,
      business: businessId,
      metadata: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        importType: 'CSV'
      },
      status: result.failed === 0 ? 'success' : 'success'
    });

    return result;
  }

  /**
   * Validate staff record from CSV
   */
  private validateStaffRecord(record: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!record.name || !record.name.trim()) {
      errors.push('Name is required');
    }

    if (record.email && !this.isValidEmail(record.email)) {
      errors.push('Invalid email format');
    }

    if (record.phone && !this.isValidPhone(record.phone)) {
      errors.push('Invalid phone format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform CSV data to Staff model format
   */
  private transformToStaffData(record: any, businessId: string): any {
    return {
      name: record.name.trim(),
      uid: record.uid || this.generateUID(record.name),
      email: record.email?.trim() || undefined,
      phone: record.phone?.trim() || undefined,
      business: businessId,
      department: record.department || undefined,
      role: record.role || 'staff',
      isActive: record.status?.toLowerCase() !== 'inactive'
    };
  }

  /**
   * Generate UID from name if not provided
   */
  private generateUID(name: string): string {
    const sanitized = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${sanitized.substring(0, 5)}${random}`;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Get CSV template for staff import
   */
  getCSVTemplate(): string {
    return 'name,uid,email,phone,department,role,status\n' +
           'John Doe,STAFF001,john@example.com,1234567890,,staff,active\n' +
           'Jane Smith,STAFF002,jane@example.com,9876543210,,manager,active\n';
  }
}
