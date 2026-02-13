/**
 * Custom Report Builder Service
 * Allows dynamic report generation with custom configurations
 * Phase 6: Admin Dashboard Enhancements
 */

import { Staff } from '../modules/staff/models/Staff';
import { Attendance } from '../modules/attendance/models/Attendance';
import { Activity } from '../modules/activity/models/Activity';
import { Alert } from '../modules/alert/models/Alert';
import ExportService from '../modules/report/services/ExportService';
import cacheService from './CacheService';

export interface CustomReportConfig {
  name: string;
  type: 'staff' | 'attendance' | 'activity' | 'alert';
  fields: string[];
  filters: FilterConfig[];
  groupBy?: string;
  aggregations?: AggregationConfig[];
  sortBy: SortConfig[];
  limit?: number;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'regex';
  value: any;
}

export interface AggregationConfig {
  operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  field?: string;
  alias: string;
}

export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

export default class CustomReportBuilderService {
  private exportService: ExportService;
  private cacheService = cacheService;

  constructor() {
    this.exportService = new ExportService();
  }

  /**
   * Build and execute custom report
   */
  async buildCustomReport(
    config: CustomReportConfig,
    businessId: string
  ): Promise<any> {
    // Get the appropriate model
    const Model = this.getModel(config.type);

    // Build aggregation pipeline
    const pipeline = this.buildAggregationPipeline(config, businessId);

    // Execute query
    const results = await Model.aggregate(pipeline);

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
  }

  /**
   * Build MongoDB aggregation pipeline from config
   */
  private buildAggregationPipeline(
    config: CustomReportConfig,
    businessId: string
  ): any[] {
    const pipeline: any[] = [];

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
  private buildMatchStage(config: CustomReportConfig, businessId: string): any {
    const match: any = {};

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
  private buildFilterCondition(filter: FilterConfig): any {
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
  private buildGroupStage(config: CustomReportConfig): any {
    const group: any = {
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
  private buildAggregation(agg: AggregationConfig): any {
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
  private buildProjectStage(fields: string[]): any {
    const project: any = {};

    for (const field of fields) {
      project[field] = 1;
    }

    return project;
  }

  /**
   * Build sort stage
   */
  private buildSortStage(sortBy: SortConfig[]): any {
    const sort: any = {};

    for (const s of sortBy) {
      sort[s.field] = s.order === 'asc' ? 1 : -1;
    }

    return sort;
  }

  /**
   * Get model based on report type
   */
  private getModel(type: string): any {
    switch (type) {
      case 'staff':
        return Staff;
      case 'attendance':
        return Attendance;
      case 'activity':
        return Activity;
      case 'alert':
        return Alert;
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  /**
   * Export custom report to CSV
   */
  async exportToCSV(reportData: any): Promise<string> {
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
  }

  /**
   * Save custom report configuration for reuse
   */
  async saveReportConfig(
    config: CustomReportConfig,
    userId: string
  ): Promise<void> {
    const cacheKey = `custom_report:config:${userId}:${config.name}`;
    await this.cacheService.set(cacheKey, config, 2592000); // 30 days
  }

  /**
   * Get saved report configurations
   */
  async getSavedConfigs(userId: string): Promise<CustomReportConfig[]> {
    const pattern = `custom_report:config:${userId}:*`;
    const keys = await this.cacheService.getKeysByPattern(pattern);

    const configs: CustomReportConfig[] = [];

    for (const key of keys) {
      const config = await this.cacheService.get<CustomReportConfig>(key);
      if (config) {
        configs.push(config);
      }
    }

    return configs;
  }

  /**
   * Validate custom report configuration
   */
  validateConfig(config: CustomReportConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

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
  getAvailableFields(type: string): string[] {
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
