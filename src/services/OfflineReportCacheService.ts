/**
 * Offline Report Cache Service
 * Caches reports for offline mobile access with long TTL
 * Phase 6: Mobile Sync Optimization
 */

import cacheService from './CacheService';

export interface CacheableReport {
  reportType: string;
  staffId: string;
  data: any;
  generatedAt: Date;
  expiresAt: Date;
}

export default class OfflineReportCacheService {
  private cacheService = cacheService;
  private readonly DEFAULT_TTL = 86400; // 24 hours in seconds
  private readonly LONG_TTL = 604800;   // 7 days for staff-specific reports

  constructor() {
    // cacheService is already initialized as singleton
  }

  /**
   * Cache a report for offline access
   */
  async cacheReport(
    reportType: string,
    staffId: string,
    reportData: any,
    ttl?: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(reportType, staffId);
    const cacheTTL = ttl || this.getTTLForReportType(reportType);

    const cacheableReport: CacheableReport = {
      reportType,
      staffId,
      data: reportData,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + cacheTTL * 1000)
    };

    await this.cacheService.set(cacheKey, cacheableReport, cacheTTL);
  }

  /**
   * Get cached report
   */
  async getCachedReport(
    reportType: string,
    staffId: string
  ): Promise<CacheableReport | null> {
    const cacheKey = this.generateCacheKey(reportType, staffId);
    const cached = await this.cacheService.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check if expired
    const report = cached as CacheableReport;
    if (new Date() > new Date(report.expiresAt)) {
      await this.invalidateReport(reportType, staffId);
      return null;
    }

    return report;
  }

  /**
   * Cache multiple reports for a staff member
   */
  async cacheStaffReports(
    staffId: string,
    reports: { reportType: string; data: any }[]
  ): Promise<void> {
    const cachePromises = reports.map(report =>
      this.cacheReport(report.reportType, staffId, report.data)
    );

    await Promise.all(cachePromises);
  }

  /**
   * Get all cached reports for a staff member
   */
  async getStaffReports(
    staffId: string,
    reportTypes: string[]
  ): Promise<Map<string, any>> {
    const reportMap = new Map<string, any>();

    const fetchPromises = reportTypes.map(async reportType => {
      const report = await this.getCachedReport(reportType, staffId);
      if (report) {
        reportMap.set(reportType, report.data);
      }
    });

    await Promise.all(fetchPromises);

    return reportMap;
  }

  /**
   * Invalidate a specific report
   */
  async invalidateReport(reportType: string, staffId: string): Promise<void> {
    const cacheKey = this.generateCacheKey(reportType, staffId);
    await this.cacheService.del(cacheKey);
  }

  /**
   * Invalidate all reports for a staff member
   */
  async invalidateStaffReports(staffId: string): Promise<void> {
    const pattern = `offline:report:${staffId}:*`;
    await this.cacheService.deletePattern(pattern);
  }

  /**
   * Invalidate all reports of a specific type
   */
  async invalidateReportType(reportType: string): Promise<void> {
    const pattern = `offline:report:*:${reportType}`;
    await this.cacheService.deletePattern(pattern);
  }

  /**
   * Pre-cache reports for offline use
   * Call this when staff goes offline or at end of day
   */
  async preCacheForOffline(
    staffId: string,
    reportGenerators: Map<string, () => Promise<any>>
  ): Promise<{
    successful: number;
    failed: number;
    reports: string[];
  }> {
    const results = {
      successful: 0,
      failed: 0,
      reports: [] as string[]
    };

    for (const [reportType, generator] of reportGenerators) {
      try {
        const reportData = await generator();
        await this.cacheReport(reportType, staffId, reportData);
        results.successful++;
        results.reports.push(reportType);
      } catch (error) {
        console.error(`Failed to pre-cache ${reportType}:`, error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStatistics(staffId: string): Promise<{
    totalReports: number;
    reportTypes: string[];
    oldestReport: Date | null;
    newestReport: Date | null;
    totalSizeKB: number;
  }> {
    const pattern = `offline:report:${staffId}:*`;
    const keys = await this.cacheService.getKeysByPattern(pattern);

    const stats = {
      totalReports: keys.length,
      reportTypes: [] as string[],
      oldestReport: null as Date | null,
      newestReport: null as Date | null,
      totalSizeKB: 0
    };

    for (const key of keys) {
      const report = await this.cacheService.get(key);
      if (report) {
        const cacheableReport = report as CacheableReport;
        stats.reportTypes.push(cacheableReport.reportType);

        const generatedAt = new Date(cacheableReport.generatedAt);
        if (!stats.oldestReport || generatedAt < stats.oldestReport) {
          stats.oldestReport = generatedAt;
        }
        if (!stats.newestReport || generatedAt > stats.newestReport) {
          stats.newestReport = generatedAt;
        }

        // Estimate size (rough approximation)
        const size = JSON.stringify(report).length / 1024;
        stats.totalSizeKB += size;
      }
    }

    return stats;
  }

  /**
   * Check if report needs refresh
   */
  async needsRefresh(
    reportType: string,
    staffId: string,
    maxAgeSeconds: number = 3600
  ): Promise<boolean> {
    const cached = await this.getCachedReport(reportType, staffId);

    if (!cached) {
      return true;
    }

    const age = Date.now() - new Date(cached.generatedAt).getTime();
    return age > maxAgeSeconds * 1000;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(reportType: string, staffId: string): string {
    return `offline:report:${staffId}:${reportType}`;
  }

  /**
   * Get appropriate TTL based on report type
   */
  private getTTLForReportType(reportType: string): number {
    // Staff-specific reports can be cached longer
    const longCacheTypes = [
      'staff_attendance_history',
      'staff_activity_summary',
      'staff_performance',
      'personal_report'
    ];

    if (longCacheTypes.includes(reportType)) {
      return this.LONG_TTL;
    }

    return this.DEFAULT_TTL;
  }

  /**
   * Cleanup expired reports
   * Should be run periodically (cron job)
   */
  async cleanupExpired(): Promise<number> {
    const pattern = `offline:report:*`;
    const keys = await this.cacheService.getKeysByPattern(pattern);
    let cleaned = 0;

    for (const key of keys) {
      const report = await this.cacheService.get(key);
      if (report) {
        const cacheableReport = report as CacheableReport;
        if (new Date() > new Date(cacheableReport.expiresAt)) {
          await this.cacheService.del(key);
          cleaned++;
        }
      }
    }

    return cleaned;
  }
}
