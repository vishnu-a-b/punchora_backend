/**
 * Cache Optimization Script
 * Analyzes Redis cache performance and provides recommendations
 * Phase 6: Week 4 - Optimization
 */

import CacheService from '../services/CacheService';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

interface CacheStats {
  pattern: string;
  keys: number;
  totalSize: number;
  avgTTL: number;
  hitRate?: number;
}

interface CacheAnalysis {
  totalKeys: number;
  totalMemory: string;
  hitRate: number;
  missRate: number;
  evictionRate: number;
  patterns: CacheStats[];
  recommendations: string[];
}

class CacheOptimizer {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = CacheService.getInstance();
  }

  /**
   * Run complete cache analysis
   */
  async analyze(): Promise<CacheAnalysis> {
    console.log('🔍 Analyzing Redis cache performance...\n');

    const [
      totalKeys,
      memoryInfo,
      statsInfo,
      patternAnalysis
    ] = await Promise.all([
      this.getTotalKeys(),
      this.getMemoryInfo(),
      this.getStatsInfo(),
      this.analyzePatterns()
    ]);

    const analysis: CacheAnalysis = {
      totalKeys,
      totalMemory: this.formatBytes(memoryInfo.used_memory),
      hitRate: statsInfo.hitRate,
      missRate: statsInfo.missRate,
      evictionRate: statsInfo.evictionRate,
      patterns: patternAnalysis,
      recommendations: this.generateRecommendations(statsInfo, patternAnalysis)
    };

    return analysis;
  }

  /**
   * Get total number of keys in Redis
   */
  private async getTotalKeys(): Promise<number> {
    return await this.cacheService.dbsize();
  }

  /**
   * Get memory usage information
   */
  private async getMemoryInfo(): Promise<any> {
    const info = await this.cacheService.info('memory');
    const lines = info.split('\r\n');
    const memoryInfo: any = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        memoryInfo[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }

    return memoryInfo;
  }

  /**
   * Get cache hit/miss statistics
   */
  private async getStatsInfo(): Promise<any> {
    const info = await this.cacheService.info('stats');
    const lines = info.split('\r\n');
    const stats: any = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }

    const hits = stats.keyspace_hits || 0;
    const misses = stats.keyspace_misses || 0;
    const total = hits + misses;

    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    const missRate = total > 0 ? (misses / total) * 100 : 0;

    const evicted = stats.evicted_keys || 0;
    const evictionRate = total > 0 ? (evicted / total) * 100 : 0;

    return { hitRate, missRate, evictionRate, hits, misses, evicted };
  }

  /**
   * Analyze cache patterns
   */
  private async analyzePatterns(): Promise<CacheStats[]> {
    const patterns = [
      'analytics:*',
      'dashboard:*',
      'offline:*',
      'custom_report:*',
      'performance:*',
      'staff:*',
      'attendance:*',
      'alert:*'
    ];

    const results: CacheStats[] = [];

    for (const pattern of patterns) {
      const keys = await this.cacheService.getKeysByPattern(pattern);

      if (keys.length === 0) continue;

      let totalTTL = 0;
      let totalSize = 0;

      for (const key of keys.slice(0, 100)) { // Sample first 100 keys
        const ttl = await this.cacheService.ttl(key);
        totalTTL += ttl > 0 ? ttl : 0;

        // Estimate size
        const value = await this.cacheService.get(key);
        if (value) {
          totalSize += JSON.stringify(value).length;
        }
      }

      const avgTTL = keys.length > 0 ? totalTTL / Math.min(keys.length, 100) : 0;

      results.push({
        pattern: pattern.replace('*', '...'),
        keys: keys.length,
        totalSize,
        avgTTL: Math.round(avgTTL)
      });
    }

    return results.sort((a, b) => b.keys - a.keys);
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    stats: any,
    patterns: CacheStats[]
  ): string[] {
    const recommendations: string[] = [];

    // Hit rate analysis
    if (stats.hitRate < 80) {
      recommendations.push(
        `⚠️  Cache hit rate (${stats.hitRate.toFixed(1)}%) is below target (80%). Consider:`
      );
      recommendations.push('   - Increasing TTL for frequently accessed data');
      recommendations.push('   - Pre-warming cache for common queries');
      recommendations.push('   - Reviewing cache invalidation strategy');
    } else {
      recommendations.push(
        `✅ Cache hit rate (${stats.hitRate.toFixed(1)}%) is healthy (target: >80%)`
      );
    }

    // Eviction rate analysis
    if (stats.evictionRate > 5) {
      recommendations.push(
        `⚠️  High eviction rate (${stats.evictionRate.toFixed(1)}%). Consider:`
      );
      recommendations.push('   - Increasing Redis maxmemory');
      recommendations.push('   - Reducing TTL for low-priority data');
      recommendations.push('   - Implementing tiered caching strategy');
    }

    // Pattern-specific recommendations
    for (const pattern of patterns) {
      if (pattern.keys > 10000) {
        recommendations.push(
          `⚠️  High key count for ${pattern.pattern} (${pattern.keys} keys). Consider:`
        );
        recommendations.push('   - Implementing pagination for this pattern');
        recommendations.push('   - Adding TTL if keys are growing unbounded');
      }

      if (pattern.avgTTL < 60 && pattern.keys > 1000) {
        recommendations.push(
          `⚠️  Short TTL for ${pattern.pattern} (${pattern.avgTTL}s) with many keys. Consider:`
        );
        recommendations.push('   - Increasing TTL to reduce cache churn');
        recommendations.push('   - Evaluating if caching is beneficial');
      }

      if (pattern.totalSize > 10 * 1024 * 1024) { // > 10MB
        recommendations.push(
          `⚠️  Large memory usage for ${pattern.pattern} (${this.formatBytes(pattern.totalSize)}). Consider:`
        );
        recommendations.push('   - Compressing cached values');
        recommendations.push('   - Storing only essential fields');
      }
    }

    // General recommendations
    recommendations.push('\n📊 General Optimizations:');
    recommendations.push('   - Use Redis pipelining for bulk operations');
    recommendations.push('   - Implement cache-aside pattern for consistency');
    recommendations.push('   - Monitor cache size trends over time');
    recommendations.push('   - Set up alerts for hit rate drops');

    return recommendations;
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Print analysis report
   */
  printReport(analysis: CacheAnalysis): void {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                 CACHE PERFORMANCE REPORT                  ');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📈 Overall Statistics:');
    console.log(`   Total Keys: ${analysis.totalKeys.toLocaleString()}`);
    console.log(`   Memory Used: ${analysis.totalMemory}`);
    console.log(`   Hit Rate: ${analysis.hitRate.toFixed(2)}%`);
    console.log(`   Miss Rate: ${analysis.missRate.toFixed(2)}%`);
    console.log(`   Eviction Rate: ${analysis.evictionRate.toFixed(2)}%\n`);

    console.log('🔑 Cache Patterns:');
    console.log('   Pattern                Keys      Size        Avg TTL');
    console.log('   ─────────────────────────────────────────────────────');

    for (const pattern of analysis.patterns) {
      const keysStr = pattern.keys.toString().padEnd(9);
      const sizeStr = this.formatBytes(pattern.totalSize).padEnd(11);
      const ttlStr = `${pattern.avgTTL}s`;
      console.log(`   ${pattern.pattern.padEnd(20)} ${keysStr} ${sizeStr} ${ttlStr}`);
    }

    console.log('\n💡 Recommendations:');
    for (const rec of analysis.recommendations) {
      console.log(rec);
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
  }

  /**
   * Export report to file
   */
  async exportReport(analysis: CacheAnalysis): Promise<string> {
    const fs = require('fs');
    const path = require('path');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cache-analysis-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'reports', filename);

    // Create reports directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));

    return filepath;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Connect to MongoDB (some services may need it)
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected\n');
    }

    const optimizer = new CacheOptimizer();
    const analysis = await optimizer.analyze();

    optimizer.printReport(analysis);

    // Export to file
    const filepath = await optimizer.exportReport(analysis);
    console.log(`📁 Report exported to: ${filepath}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error running cache optimization:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default CacheOptimizer;
