/**
 * Alert Job Scheduler
 *
 * Manages scheduled jobs for automatic alert generation and maintenance.
 * Uses node-cron for scheduling (install: npm install node-cron @types/node-cron)
 *
 * Jobs:
 * - Daily late check-in alerts (10:00 AM)
 * - Daily missing checkout alerts (11:00 PM)
 * - Hourly expired alert cleanup (every hour)
 * - Daily old alert cleanup (2:00 AM)
 */

import AttendanceAlertGeneratorService from "../modules/alert/services/AttendanceAlertGeneratorService";
import LocationAlertGeneratorService from "../modules/alert/services/LocationAlertGeneratorService";
import AlertService from "../modules/alert/services/AlertService";

export default class AlertJobScheduler {
  private attendanceAlertService = new AttendanceAlertGeneratorService();
  private locationAlertService = new LocationAlertGeneratorService();
  private alertService = new AlertService();

  private cronInstance: any; // Will be node-cron instance if available

  constructor() {
    try {
      // Try to load node-cron if available
      this.cronInstance = require("node-cron");
      console.log("[AlertJobs] node-cron loaded successfully");
    } catch (error) {
      console.warn(
        "[AlertJobs] node-cron not installed. Install with: npm install node-cron @types/node-cron"
      );
      this.cronInstance = null;
    }
  }

  /**
   * Initialize and start all scheduled jobs
   */
  public initializeJobs(): void {
    if (!this.cronInstance) {
      console.warn(
        "[AlertJobs] Cannot initialize scheduled jobs - node-cron not available"
      );
      console.warn(
        "[AlertJobs] Jobs can still be run manually via job methods"
      );
      return;
    }

    console.log("[AlertJobs] Initializing scheduled alert jobs...");

    // Job 1: Daily late check-in alerts at 10:00 AM
    this.scheduleLateCheckinJob();

    // Job 2: Daily missing checkout alerts at 11:00 PM
    this.scheduleMissingCheckoutJob();

    // Job 3: Hourly expired alert cleanup
    this.scheduleExpiredAlertCleanup();

    // Job 4: Daily old alert cleanup at 2:00 AM
    this.scheduleOldAlertCleanup();

    console.log("[AlertJobs] All scheduled jobs initialized successfully");
  }

  /**
   * Job 1: Late Check-in Alert Generation
   * Runs daily at 10:00 AM
   * Generates alerts for staff who haven't checked in by 9:30 AM
   */
  private scheduleLateCheckinJob(): void {
    if (!this.cronInstance) return;

    const cronTime = process.env.CRON_LATE_CHECKIN || "0 10 * * *"; // 10:00 AM daily

    this.cronInstance.schedule(cronTime, async () => {
      console.log("[AlertJobs] Running late check-in job...");

      try {
        const thresholdTime = new Date();
        thresholdTime.setHours(9, 30, 0, 0); // 9:30 AM threshold

        const alertsCreated =
          await this.attendanceAlertService.generateLateCheckinAlerts(
            thresholdTime
          );

        console.log(
          `[AlertJobs] Late check-in job completed - ${alertsCreated} alerts created`
        );
      } catch (error) {
        console.error("[AlertJobs] Late check-in job failed:", error);
      }
    });

    console.log(`[AlertJobs] Late check-in job scheduled: ${cronTime}`);
  }

  /**
   * Job 2: Missing Checkout Alert Generation
   * Runs daily at 11:00 PM
   * Generates alerts for staff who forgot to check out
   */
  private scheduleMissingCheckoutJob(): void {
    if (!this.cronInstance) return;

    const cronTime = process.env.CRON_MISSING_CHECKOUT || "0 23 * * *"; // 11:00 PM daily

    this.cronInstance.schedule(cronTime, async () => {
      console.log("[AlertJobs] Running missing checkout job...");

      try {
        const alertsCreated =
          await this.attendanceAlertService.generateMissingCheckoutAlerts();

        console.log(
          `[AlertJobs] Missing checkout job completed - ${alertsCreated} alerts created`
        );
      } catch (error) {
        console.error("[AlertJobs] Missing checkout job failed:", error);
      }
    });

    console.log(`[AlertJobs] Missing checkout job scheduled: ${cronTime}`);
  }

  /**
   * Job 3: Expired Alert Cleanup
   * Runs every hour
   * Auto-dismisses alerts older than configured expiry time
   */
  private scheduleExpiredAlertCleanup(): void {
    if (!this.cronInstance) return;

    const cronTime = process.env.CRON_EXPIRED_CLEANUP || "0 * * * *"; // Every hour
    const expiryHours = parseInt(process.env.ALERT_EXPIRY_HOURS || "24", 10);

    this.cronInstance.schedule(cronTime, async () => {
      console.log("[AlertJobs] Running expired alert cleanup...");

      try {
        const expiredCount = await this.alertService.expireOldAlerts(
          expiryHours
        );

        console.log(
          `[AlertJobs] Expired alert cleanup completed - ${expiredCount} alerts expired`
        );
      } catch (error) {
        console.error("[AlertJobs] Expired alert cleanup failed:", error);
      }
    });

    console.log(
      `[AlertJobs] Expired alert cleanup scheduled: ${cronTime} (${expiryHours}h expiry)`
    );
  }

  /**
   * Job 4: Old Alert Cleanup
   * Runs daily at 2:00 AM
   * Deletes resolved/dismissed alerts older than 30 days
   */
  private scheduleOldAlertCleanup(): void {
    if (!this.cronInstance) return;

    const cronTime = process.env.CRON_OLD_CLEANUP || "0 2 * * *"; // 2:00 AM daily
    const retentionDays = parseInt(
      process.env.ALERT_RETENTION_DAYS || "30",
      10
    );

    this.cronInstance.schedule(cronTime, async () => {
      console.log("[AlertJobs] Running old alert cleanup...");

      try {
        const deletedCount = await this.alertService.cleanupOldAlerts(
          retentionDays
        );

        console.log(
          `[AlertJobs] Old alert cleanup completed - ${deletedCount} alerts deleted`
        );
      } catch (error) {
        console.error("[AlertJobs] Old alert cleanup failed:", error);
      }
    });

    console.log(
      `[AlertJobs] Old alert cleanup scheduled: ${cronTime} (${retentionDays}d retention)`
    );
  }

  /**
   * Manual job execution methods
   * Can be called directly without cron scheduling
   */

  public async runLateCheckinJob(): Promise<number> {
    console.log("[AlertJobs] Manually running late check-in job...");

    const thresholdTime = new Date();
    thresholdTime.setHours(9, 30, 0, 0);

    const count = await this.attendanceAlertService.generateLateCheckinAlerts(
      thresholdTime
    );

    console.log(`[AlertJobs] Late check-in job completed - ${count} alerts`);
    return count;
  }

  public async runMissingCheckoutJob(): Promise<number> {
    console.log("[AlertJobs] Manually running missing checkout job...");

    const count =
      await this.attendanceAlertService.generateMissingCheckoutAlerts();

    console.log(`[AlertJobs] Missing checkout job completed - ${count} alerts`);
    return count;
  }

  public async runExpiredAlertCleanup(): Promise<number> {
    console.log("[AlertJobs] Manually running expired alert cleanup...");

    const expiryHours = parseInt(process.env.ALERT_EXPIRY_HOURS || "24", 10);
    const count = await this.alertService.expireOldAlerts(expiryHours);

    console.log(`[AlertJobs] Expired alert cleanup completed - ${count} alerts`);
    return count;
  }

  public async runOldAlertCleanup(): Promise<number> {
    console.log("[AlertJobs] Manually running old alert cleanup...");

    const retentionDays = parseInt(
      process.env.ALERT_RETENTION_DAYS || "30",
      10
    );
    const count = await this.alertService.cleanupOldAlerts(retentionDays);

    console.log(`[AlertJobs] Old alert cleanup completed - ${count} alerts`);
    return count;
  }

  /**
   * Run all daily jobs manually (useful for testing)
   */
  public async runAllDailyJobs(): Promise<{
    lateCheckin: number;
    missingCheckout: number;
    expiredCleanup: number;
  }> {
    console.log("[AlertJobs] Running all daily jobs...");

    const lateCheckin = await this.runLateCheckinJob();
    const missingCheckout = await this.runMissingCheckoutJob();
    const expiredCleanup = await this.runExpiredAlertCleanup();

    console.log("[AlertJobs] All daily jobs completed");

    return {
      lateCheckin,
      missingCheckout,
      expiredCleanup,
    };
  }

  /**
   * Get job status and next run times (if cron is available)
   */
  public getJobStatus(): any {
    if (!this.cronInstance) {
      return {
        enabled: false,
        message: "node-cron not installed - jobs can be run manually",
      };
    }

    return {
      enabled: true,
      jobs: [
        {
          name: "Late Check-in Alerts",
          schedule: process.env.CRON_LATE_CHECKIN || "0 10 * * *",
          description: "Generate alerts for staff who haven't checked in",
        },
        {
          name: "Missing Checkout Alerts",
          schedule: process.env.CRON_MISSING_CHECKOUT || "0 23 * * *",
          description: "Generate alerts for staff who forgot to check out",
        },
        {
          name: "Expired Alert Cleanup",
          schedule: process.env.CRON_EXPIRED_CLEANUP || "0 * * * *",
          description: "Auto-dismiss old unacknowledged alerts",
        },
        {
          name: "Old Alert Cleanup",
          schedule: process.env.CRON_OLD_CLEANUP || "0 2 * * *",
          description: "Delete old resolved/dismissed alerts",
        },
      ],
    };
  }
}
