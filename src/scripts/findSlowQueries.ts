/**
 * Slow Query Finder Script
 * Analyzes MongoDB slow queries and recommends indexes
 * Phase 6: Week 4 - Optimization
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

interface SlowQuery {
  ns: string;
  op: string;
  millis: number;
  planSummary: string;
  query: any;
  timestamp: Date;
}

interface IndexRecommendation {
  collection: string;
  fields: string[];
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface QueryAnalysis {
  slowQueries: SlowQuery[];
  indexRecommendations: IndexRecommendation[];
  collectionStats: any[];
  summary: {
    totalQueries: number;
    slowQueries: number;
    avgExecutionTime: number;
    p95ExecutionTime: number;
  };
}

class SlowQueryFinder {
  private db: mongoose.Connection;
  private readonly SLOW_THRESHOLD_MS = 100; // Queries slower than 100ms

  constructor() {
    this.db = mongoose.connection;
  }

  /**
   * Run complete query analysis
   */
  async analyze(): Promise<QueryAnalysis> {
    console.log('🔍 Analyzing MongoDB query performance...\n');

    // Enable profiling if not already enabled
    await this.enableProfiling();

    const [
      slowQueries,
      collectionStats
    ] = await Promise.all([
      this.getSlowQueries(),
      this.getCollectionStats()
    ]);

    const indexRecommendations = this.generateIndexRecommendations(slowQueries);
    const summary = this.generateSummary(slowQueries);

    return {
      slowQueries,
      indexRecommendations,
      collectionStats,
      summary
    };
  }

  /**
   * Enable MongoDB profiling
   */
  private async enableProfiling(): Promise<void> {
    try {
      const admin = this.db.db!.admin();
      await this.db.db!.command({ profile: 2, slowms: this.SLOW_THRESHOLD_MS });
      console.log(`✅ MongoDB profiling enabled (threshold: ${this.SLOW_THRESHOLD_MS}ms)\n`);
    } catch (error) {
      console.log('⚠️  Could not enable profiling (requires admin privileges)');
      console.log('   Using existing profiling data if available\n');
    }
  }

  /**
   * Get slow queries from system.profile
   */
  private async getSlowQueries(): Promise<SlowQuery[]> {
    try {
      const profileCollection = this.db.db!.collection('system.profile');

      const slowQueries = await profileCollection
        .find({
          ns: { $not: /system\./ }, // Exclude system collections
          millis: { $gte: this.SLOW_THRESHOLD_MS },
          op: { $in: ['query', 'update', 'delete', 'count'] }
        })
        .sort({ millis: -1 })
        .limit(50)
        .toArray();

      return slowQueries.map(q => ({
        ns: q.ns,
        op: q.op,
        millis: q.millis,
        planSummary: q.planSummary || 'N/A',
        query: q.command || q.query || {},
        timestamp: q.ts
      }));
    } catch (error) {
      console.log('⚠️  Could not read profiling data (profiling may not be enabled)');
      return [];
    }
  }

  /**
   * Get collection statistics
   */
  private async getCollectionStats(): Promise<any[]> {
    const collections = await this.db.db!.listCollections().toArray();
    const stats: any[] = [];

    for (const coll of collections) {
      if (coll.name.startsWith('system.')) continue;

      try {
        const collStats = await this.db.db!.command({ collStats: coll.name });
        const indexes = await this.db.db!.collection(coll.name).indexes();

        stats.push({
          name: coll.name,
          count: collStats.count,
          size: collStats.size,
          avgObjSize: collStats.avgObjSize,
          indexCount: indexes.length,
          indexes: indexes.map(idx => ({
            name: idx.name,
            keys: Object.keys(idx.key).join(', ')
          }))
        });
      } catch (error) {
        // Skip collections that can't be accessed
      }
    }

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Generate index recommendations from slow queries
   */
  private generateIndexRecommendations(slowQueries: SlowQuery[]): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];
    const queryPatterns: Map<string, number> = new Map();

    for (const query of slowQueries) {
      // Skip if already using an index
      if (query.planSummary && query.planSummary.includes('IXSCAN')) {
        continue;
      }

      const collection = query.ns.split('.')[1];
      if (!collection) continue;

      const fields = this.extractQueryFields(query.query);
      if (fields.length === 0) continue;

      const pattern = `${collection}:${fields.join(',')}`;
      queryPatterns.set(pattern, (queryPatterns.get(pattern) || 0) + 1);
    }

    // Convert patterns to recommendations
    for (const [pattern, count] of queryPatterns.entries()) {
      const [collection, fieldsStr] = pattern.split(':');
      const fields = fieldsStr.split(',');

      let priority: 'high' | 'medium' | 'low' = 'low';
      if (count >= 10) priority = 'high';
      else if (count >= 5) priority = 'medium';

      recommendations.push({
        collection,
        fields,
        reason: `${count} slow queries using these fields (COLLSCAN detected)`,
        priority
      });
    }

    // Add common pattern recommendations
    this.addCommonPatternRecommendations(recommendations);

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Extract query fields for index recommendation
   */
  private extractQueryFields(query: any): string[] {
    const fields: Set<string> = new Set();

    const traverse = (obj: any, prefix = '') => {
      for (const key in obj) {
        if (key.startsWith('$')) continue; // Skip operators

        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          traverse(obj[key], fullKey);
        } else {
          fields.add(fullKey);
        }
      }
    };

    // Handle different query formats
    if (query.find) traverse(query.find);
    else if (query.filter) traverse(query.filter);
    else if (query.q) traverse(query.q);
    else traverse(query);

    return Array.from(fields).slice(0, 3); // Max 3 fields for compound index
  }

  /**
   * Add common index patterns
   */
  private addCommonPatternRecommendations(recommendations: IndexRecommendation[]): void {
    const commonPatterns = [
      { collection: 'attendance', fields: ['staff', 'date'], priority: 'high' as const },
      { collection: 'attendance', fields: ['date', 'business'], priority: 'high' as const },
      { collection: 'alerts', fields: ['business', 'status', 'createdAt'], priority: 'high' as const },
      { collection: 'activities', fields: ['business', 'staff', 'startTime'], priority: 'medium' as const },
      { collection: 'staff', fields: ['business', 'isActive'], priority: 'medium' as const },
      { collection: 'syncbatches', fields: ['status', 'startedAt'], priority: 'medium' as const }
    ];

    for (const pattern of commonPatterns) {
      const exists = recommendations.some(
        r => r.collection === pattern.collection &&
             r.fields.join(',') === pattern.fields.join(',')
      );

      if (!exists) {
        recommendations.push({
          ...pattern,
          reason: 'Common query pattern (recommended)'
        });
      }
    }
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(slowQueries: SlowQuery[]): QueryAnalysis['summary'] {
    if (slowQueries.length === 0) {
      return {
        totalQueries: 0,
        slowQueries: 0,
        avgExecutionTime: 0,
        p95ExecutionTime: 0
      };
    }

    const executionTimes = slowQueries.map(q => q.millis).sort((a, b) => a - b);
    const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const p95Index = Math.floor(executionTimes.length * 0.95);
    const p95ExecutionTime = executionTimes[p95Index] || 0;

    return {
      totalQueries: slowQueries.length,
      slowQueries: slowQueries.length,
      avgExecutionTime: Math.round(avgExecutionTime),
      p95ExecutionTime: Math.round(p95ExecutionTime)
    };
  }

  /**
   * Print analysis report
   */
  printReport(analysis: QueryAnalysis): void {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                  QUERY PERFORMANCE REPORT                 ');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Slow Queries Found: ${analysis.summary.slowQueries}`);
    console.log(`   Avg Execution Time: ${analysis.summary.avgExecutionTime}ms`);
    console.log(`   P95 Execution Time: ${analysis.summary.p95ExecutionTime}ms`);
    console.log(`   Threshold: ${this.SLOW_THRESHOLD_MS}ms\n`);

    // Top slow queries
    if (analysis.slowQueries.length > 0) {
      console.log('🐌 Top 10 Slowest Queries:');
      console.log('   Collection        Op       Time     Plan');
      console.log('   ──────────────────────────────────────────────────────');

      for (const query of analysis.slowQueries.slice(0, 10)) {
        const coll = query.ns.split('.')[1] || 'unknown';
        const collStr = coll.substring(0, 17).padEnd(17);
        const opStr = query.op.padEnd(8);
        const timeStr = `${query.millis}ms`.padEnd(8);
        const planStr = query.planSummary.substring(0, 20);

        console.log(`   ${collStr} ${opStr} ${timeStr} ${planStr}`);
      }
      console.log();
    }

    // Index recommendations
    if (analysis.indexRecommendations.length > 0) {
      console.log('💡 Index Recommendations:');

      const highPriority = analysis.indexRecommendations.filter(r => r.priority === 'high');
      const mediumPriority = analysis.indexRecommendations.filter(r => r.priority === 'medium');
      const lowPriority = analysis.indexRecommendations.filter(r => r.priority === 'low');

      if (highPriority.length > 0) {
        console.log('\n   🔴 HIGH PRIORITY:');
        for (const rec of highPriority) {
          console.log(`      db.${rec.collection}.createIndex({ ${rec.fields.map(f => `${f}: 1`).join(', ')} });`);
          console.log(`      Reason: ${rec.reason}\n`);
        }
      }

      if (mediumPriority.length > 0) {
        console.log('   🟡 MEDIUM PRIORITY:');
        for (const rec of mediumPriority) {
          console.log(`      db.${rec.collection}.createIndex({ ${rec.fields.map(f => `${f}: 1`).join(', ')} });`);
          console.log(`      Reason: ${rec.reason}\n`);
        }
      }

      if (lowPriority.length > 0) {
        console.log('   🟢 LOW PRIORITY:');
        for (const rec of lowPriority) {
          console.log(`      db.${rec.collection}.createIndex({ ${rec.fields.map(f => `${f}: 1`).join(', ')} });`);
          console.log(`      Reason: ${rec.reason}\n`);
        }
      }
    } else {
      console.log('✅ No index recommendations (all queries using indexes efficiently)\n');
    }

    // Collection stats
    if (analysis.collectionStats.length > 0) {
      console.log('📁 Collection Statistics:');
      console.log('   Collection        Documents  Size      Indexes');
      console.log('   ───────────────────────────────────────────────');

      for (const stat of analysis.collectionStats.slice(0, 10)) {
        const nameStr = stat.name.substring(0, 17).padEnd(17);
        const countStr = stat.count.toLocaleString().padEnd(10);
        const sizeStr = this.formatBytes(stat.size).padEnd(9);
        const indexStr = stat.indexCount.toString();

        console.log(`   ${nameStr} ${countStr} ${sizeStr} ${indexStr}`);
      }
      console.log();
    }

    console.log('═══════════════════════════════════════════════════════════\n');
  }

  /**
   * Generate index creation script
   */
  generateIndexScript(recommendations: IndexRecommendation[]): string {
    let script = '// MongoDB Index Creation Script\n';
    script += '// Generated by findSlowQueries.ts\n';
    script += `// Date: ${new Date().toISOString()}\n\n`;

    script += '// Connect to your database:\n';
    script += '// use hrms\n\n';

    for (const rec of recommendations) {
      script += `// Priority: ${rec.priority.toUpperCase()}\n`;
      script += `// ${rec.reason}\n`;
      script += `db.${rec.collection}.createIndex({ ${rec.fields.map(f => `${f}: 1`).join(', ')} });\n\n`;
    }

    return script;
  }

  /**
   * Export report to files
   */
  async exportReport(analysis: QueryAnalysis): Promise<{ json: string; script: string }> {
    const fs = require('fs');
    const path = require('path');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // JSON report
    const jsonFilename = `slow-queries-${timestamp}.json`;
    const jsonPath = path.join(process.cwd(), 'reports', jsonFilename);

    // Index script
    const scriptFilename = `create-indexes-${timestamp}.js`;
    const scriptPath = path.join(process.cwd(), 'reports', scriptFilename);

    // Create reports directory
    const dir = path.dirname(jsonPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write files
    fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
    fs.writeFileSync(scriptPath, this.generateIndexScript(analysis.indexRecommendations));

    return { json: jsonPath, script: scriptPath };
  }

  /**
   * Format bytes to human-readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const finder = new SlowQueryFinder();
    const analysis = await finder.analyze();

    finder.printReport(analysis);

    // Export to files
    const files = await finder.exportReport(analysis);
    console.log(`📁 JSON report: ${files.json}`);
    console.log(`📁 Index script: ${files.script}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error analyzing queries:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default SlowQueryFinder;
