"use strict";
/**
 * Custom Report Builder Service
 * Allows dynamic report generation with custom configurations
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
const Staff_1 = require("../modules/staff/models/Staff");
const Attendance_1 = require("../modules/attendance/models/Attendance");
const Activity_1 = require("../modules/activity/models/Activity");
const Alert_1 = require("../modules/alert/models/Alert");
const ExportService_1 = __importDefault(require("../modules/report/services/ExportService"));
const CacheService_1 = __importDefault(require("./CacheService"));
class CustomReportBuilderService {
    constructor() {
        this.cacheService = CacheService_1.default;
        this.exportService = new ExportService_1.default();
    }
    /**
     * Build and execute custom report
     */
    buildCustomReport(config, businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the appropriate model
            const Model = this.getModel(config.type);
            // Build aggregation pipeline
            const pipeline = this.buildAggregationPipeline(config, businessId);
            // Execute query
            const results = yield Model.aggregate(pipeline);
            return {
                reportName: config.name,
                reportType: config.type,
                generatedAt: new Date(),
                totalRecords: results.length,
                data: results,
                config: {
                    fields: config.fields,
                    filters: config.filters,
                    groupBy: config.groupBy,
                    aggregations: config.aggregations
                }
            };
        });
    }
    /**
     * Build MongoDB aggregation pipeline from config
     */
    buildAggregationPipeline(config, businessId) {
        const pipeline = [];
        // Stage 1: Match business and filters
        const matchStage = this.buildMatchStage(config, businessId);
        if (matchStage) {
            pipeline.push({ $match: matchStage });
        }
        // Stage 2: Group (if specified)
        if (config.groupBy) {
            const groupStage = this.buildGroupStage(config);
            pipeline.push({ $group: groupStage });
        }
        // Stage 3: Project (field selection)
        if (config.fields && config.fields.length > 0 && !config.groupBy) {
            const projectStage = this.buildProjectStage(config.fields);
            pipeline.push({ $project: projectStage });
        }
        // Stage 4: Sort
        if (config.sortBy && config.sortBy.length > 0) {
            const sortStage = this.buildSortStage(config.sortBy);
            pipeline.push({ $sort: sortStage });
        }
        // Stage 5: Limit
        if (config.limit && config.limit > 0) {
            pipeline.push({ $limit: config.limit });
        }
        return pipeline;
    }
    /**
     * Build match stage from filters
     */
    buildMatchStage(config, businessId) {
        const match = {};
        // Add business filter for types that have it
        if (['staff', 'activity', 'alert'].includes(config.type)) {
            match.business = businessId;
        }
        // Apply custom filters
        if (config.filters && config.filters.length > 0) {
            for (const filter of config.filters) {
                const condition = this.buildFilterCondition(filter);
                if (condition) {
                    match[filter.field] = condition;
                }
            }
        }
        return Object.keys(match).length > 0 ? match : null;
    }
    /**
     * Build filter condition based on operator
     */
    buildFilterCondition(filter) {
        switch (filter.operator) {
            case 'eq':
                return filter.value;
            case 'ne':
                return { $ne: filter.value };
            case 'gt':
                return { $gt: filter.value };
            case 'lt':
                return { $lt: filter.value };
            case 'gte':
                return { $gte: filter.value };
            case 'lte':
                return { $lte: filter.value };
            case 'in':
                return { $in: Array.isArray(filter.value) ? filter.value : [filter.value] };
            case 'regex':
                return { $regex: filter.value, $options: 'i' };
            default:
                return filter.value;
        }
    }
    /**
     * Build group stage with aggregations
     */
    buildGroupStage(config) {
        const group = {
            _id: `$${config.groupBy}`
        };
        // Add aggregations
        if (config.aggregations && config.aggregations.length > 0) {
            for (const agg of config.aggregations) {
                group[agg.alias] = this.buildAggregation(agg);
            }
        }
        return group;
    }
    /**
     * Build aggregation expression
     */
    buildAggregation(agg) {
        switch (agg.operation) {
            case 'count':
                return { $sum: 1 };
            case 'sum':
                return { $sum: `$${agg.field}` };
            case 'avg':
                return { $avg: `$${agg.field}` };
            case 'min':
                return { $min: `$${agg.field}` };
            case 'max':
                return { $max: `$${agg.field}` };
            default:
                return { $sum: 1 };
        }
    }
    /**
     * Build project stage for field selection
     */
    buildProjectStage(fields) {
        const project = {};
        for (const field of fields) {
            project[field] = 1;
        }
        return project;
    }
    /**
     * Build sort stage
     */
    buildSortStage(sortBy) {
        const sort = {};
        for (const s of sortBy) {
            sort[s.field] = s.order === 'asc' ? 1 : -1;
        }
        return sort;
    }
    /**
     * Get model based on report type
     */
    getModel(type) {
        switch (type) {
            case 'staff':
                return Staff_1.Staff;
            case 'attendance':
                return Attendance_1.Attendance;
            case 'activity':
                return Activity_1.Activity;
            case 'alert':
                return Alert_1.Alert;
            default:
                throw new Error(`Unknown report type: ${type}`);
        }
    }
    /**
     * Export custom report to CSV
     */
    exportToCSV(reportData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!reportData.data || reportData.data.length === 0) {
                return 'No data available\n';
            }
            // Get column headers from first record
            const firstRecord = reportData.data[0];
            const headers = Object.keys(firstRecord).filter(k => k !== '__v');
            let csv = headers.join(',') + '\n';
            // Add data rows
            for (const record of reportData.data) {
                const values = headers.map(header => {
                    const value = record[header];
                    if (value === null || value === undefined) {
                        return '';
                    }
                    // Escape quotes and wrap in quotes if contains comma
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
                csv += values.join(',') + '\n';
            }
            return csv;
        });
    }
    /**
     * Save custom report configuration for reuse
     */
    saveReportConfig(config, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = `custom_report:config:${userId}:${config.name}`;
            yield this.cacheService.set(cacheKey, config, 2592000); // 30 days
        });
    }
    /**
     * Get saved report configurations
     */
    getSavedConfigs(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pattern = `custom_report:config:${userId}:*`;
            const keys = yield this.cacheService.getKeysByPattern(pattern);
            const configs = [];
            for (const key of keys) {
                const config = yield this.cacheService.get(key);
                if (config) {
                    configs.push(config);
                }
            }
            return configs;
        });
    }
    /**
     * Validate custom report configuration
     */
    validateConfig(config) {
        const errors = [];
        if (!config.name || config.name.trim() === '') {
            errors.push('Report name is required');
        }
        if (!['staff', 'attendance', 'activity', 'alert'].includes(config.type)) {
            errors.push('Invalid report type');
        }
        if (config.groupBy && config.aggregations && config.aggregations.length === 0) {
            errors.push('Aggregations required when using groupBy');
        }
        if (config.sortBy && config.sortBy.length === 0) {
            errors.push('At least one sort field required if sortBy is specified');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Get available fields for a report type
     */
    getAvailableFields(type) {
        switch (type) {
            case 'staff':
                return ['name', 'uid', 'email', 'phone', 'role', 'isActive', 'createdAt'];
            case 'attendance':
                return ['date', 'checkInTime', 'checkOutTime', 'status', 'flagged', 'flagReason'];
            case 'activity':
                return ['type', 'status', 'startTime', 'endTime', 'duration', 'reason'];
            case 'alert':
                return ['type', 'severity', 'status', 'title', 'message', 'acknowledged', 'resolved'];
            default:
                return [];
        }
    }
}
exports.default = CustomReportBuilderService;
