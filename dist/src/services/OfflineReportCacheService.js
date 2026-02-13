"use strict";
/**
 * Offline Report Cache Service
 * Caches reports for offline mobile access with long TTL
 * Phase 6: Mobile Sync Optimization
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
const CacheService_1 = __importDefault(require("./CacheService"));
class OfflineReportCacheService {
    constructor() {
        this.cacheService = CacheService_1.default;
        this.DEFAULT_TTL = 86400; // 24 hours in seconds
        this.LONG_TTL = 604800; // 7 days for staff-specific reports
        // cacheService is already initialized as singleton
    }
    /**
     * Cache a report for offline access
     */
    cacheReport(reportType, staffId, reportData, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = this.generateCacheKey(reportType, staffId);
            const cacheTTL = ttl || this.getTTLForReportType(reportType);
            const cacheableReport = {
                reportType,
                staffId,
                data: reportData,
                generatedAt: new Date(),
                expiresAt: new Date(Date.now() + cacheTTL * 1000)
            };
            yield this.cacheService.set(cacheKey, cacheableReport, cacheTTL);
        });
    }
    /**
     * Get cached report
     */
    getCachedReport(reportType, staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = this.generateCacheKey(reportType, staffId);
            const cached = yield this.cacheService.get(cacheKey);
            if (!cached) {
                return null;
            }
            // Check if expired
            const report = cached;
            if (new Date() > new Date(report.expiresAt)) {
                yield this.invalidateReport(reportType, staffId);
                return null;
            }
            return report;
        });
    }
    /**
     * Cache multiple reports for a staff member
     */
    cacheStaffReports(staffId, reports) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachePromises = reports.map(report => this.cacheReport(report.reportType, staffId, report.data));
            yield Promise.all(cachePromises);
        });
    }
    /**
     * Get all cached reports for a staff member
     */
    getStaffReports(staffId, reportTypes) {
        return __awaiter(this, void 0, void 0, function* () {
            const reportMap = new Map();
            const fetchPromises = reportTypes.map((reportType) => __awaiter(this, void 0, void 0, function* () {
                const report = yield this.getCachedReport(reportType, staffId);
                if (report) {
                    reportMap.set(reportType, report.data);
                }
            }));
            yield Promise.all(fetchPromises);
            return reportMap;
        });
    }
    /**
     * Invalidate a specific report
     */
    invalidateReport(reportType, staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = this.generateCacheKey(reportType, staffId);
            yield this.cacheService.del(cacheKey);
        });
    }
    /**
     * Invalidate all reports for a staff member
     */
    invalidateStaffReports(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pattern = `offline:report:${staffId}:*`;
            yield this.cacheService.deletePattern(pattern);
        });
    }
    /**
     * Invalidate all reports of a specific type
     */
    invalidateReportType(reportType) {
        return __awaiter(this, void 0, void 0, function* () {
            const pattern = `offline:report:*:${reportType}`;
            yield this.cacheService.deletePattern(pattern);
        });
    }
    /**
     * Pre-cache reports for offline use
     * Call this when staff goes offline or at end of day
     */
    preCacheForOffline(staffId, reportGenerators) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = {
                successful: 0,
                failed: 0,
                reports: []
            };
            for (const [reportType, generator] of reportGenerators) {
                try {
                    const reportData = yield generator();
                    yield this.cacheReport(reportType, staffId, reportData);
                    results.successful++;
                    results.reports.push(reportType);
                }
                catch (error) {
                    console.error(`Failed to pre-cache ${reportType}:`, error);
                    results.failed++;
                }
            }
            return results;
        });
    }
    /**
     * Get cache statistics for monitoring
     */
    getCacheStatistics(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pattern = `offline:report:${staffId}:*`;
            const keys = yield this.cacheService.getKeysByPattern(pattern);
            const stats = {
                totalReports: keys.length,
                reportTypes: [],
                oldestReport: null,
                newestReport: null,
                totalSizeKB: 0
            };
            for (const key of keys) {
                const report = yield this.cacheService.get(key);
                if (report) {
                    const cacheableReport = report;
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
        });
    }
    /**
     * Check if report needs refresh
     */
    needsRefresh(reportType_1, staffId_1) {
        return __awaiter(this, arguments, void 0, function* (reportType, staffId, maxAgeSeconds = 3600) {
            const cached = yield this.getCachedReport(reportType, staffId);
            if (!cached) {
                return true;
            }
            const age = Date.now() - new Date(cached.generatedAt).getTime();
            return age > maxAgeSeconds * 1000;
        });
    }
    /**
     * Generate cache key
     */
    generateCacheKey(reportType, staffId) {
        return `offline:report:${staffId}:${reportType}`;
    }
    /**
     * Get appropriate TTL based on report type
     */
    getTTLForReportType(reportType) {
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
    cleanupExpired() {
        return __awaiter(this, void 0, void 0, function* () {
            const pattern = `offline:report:*`;
            const keys = yield this.cacheService.getKeysByPattern(pattern);
            let cleaned = 0;
            for (const key of keys) {
                const report = yield this.cacheService.get(key);
                if (report) {
                    const cacheableReport = report;
                    if (new Date() > new Date(cacheableReport.expiresAt)) {
                        yield this.cacheService.del(key);
                        cleaned++;
                    }
                }
            }
            return cleaned;
        });
    }
}
exports.default = OfflineReportCacheService;
