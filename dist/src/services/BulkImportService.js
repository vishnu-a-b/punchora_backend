"use strict";
/**
 * Bulk Import Service
 * Handles CSV import of staff data
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
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
const Staff_1 = require("../modules/staff/models/Staff");
const AuditService_1 = __importDefault(require("../modules/audit/services/AuditService"));
class BulkImportService {
    constructor() {
        this.auditService = new AuditService_1.default();
    }
    /**
     * Import staff from CSV file
     */
    importStaffFromCSV(csvContent, businessId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = {
                total: 0,
                successful: 0,
                failed: 0,
                errors: [],
                imported: []
            };
            const records = [];
            // Parse CSV
            yield new Promise((resolve, reject) => {
                const stream = stream_1.Readable.from([csvContent]);
                stream
                    .pipe((0, csv_parser_1.default)())
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
                    const existing = yield Staff_1.Staff.findOne({
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
                    const staff = yield Staff_1.Staff.create(staffData);
                    result.successful++;
                    result.imported.push(staff);
                }
                catch (error) {
                    result.failed++;
                    result.errors.push({
                        row: rowNumber,
                        error: error.message || 'Unknown error',
                        data: record
                    });
                }
            }
            // Log to audit
            yield this.auditService.logAsync({
                action: 'DATA_IMPORT',
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
        });
    }
    /**
     * Validate staff record from CSV
     */
    validateStaffRecord(record) {
        const errors = [];
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
    transformToStaffData(record, businessId) {
        var _a, _b, _c;
        return {
            name: record.name.trim(),
            uid: record.uid || this.generateUID(record.name),
            email: ((_a = record.email) === null || _a === void 0 ? void 0 : _a.trim()) || undefined,
            phone: ((_b = record.phone) === null || _b === void 0 ? void 0 : _b.trim()) || undefined,
            business: businessId,
            department: record.department || undefined,
            role: record.role || 'staff',
            isActive: ((_c = record.status) === null || _c === void 0 ? void 0 : _c.toLowerCase()) !== 'inactive'
        };
    }
    /**
     * Generate UID from name if not provided
     */
    generateUID(name) {
        const sanitized = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${sanitized.substring(0, 5)}${random}`;
    }
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        return emailRegex.test(email);
    }
    /**
     * Validate phone format
     */
    isValidPhone(phone) {
        const phoneRegex = /^[0-9]{10,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
    /**
     * Get CSV template for staff import
     */
    getCSVTemplate() {
        return 'name,uid,email,phone,department,role,status\n' +
            'John Doe,STAFF001,john@example.com,1234567890,,staff,active\n' +
            'Jane Smith,STAFF002,jane@example.com,9876543210,,manager,active\n';
    }
}
exports.default = BulkImportService;
