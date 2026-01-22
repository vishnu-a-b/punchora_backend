# Scheduled Jobs Guide

## Overview

The system includes automated scheduled jobs for alert generation and maintenance. Jobs can run automatically on a schedule or be triggered manually via API endpoints.

---

## Prerequisites

### Install node-cron (Required for Automatic Scheduling)

```bash
npm install node-cron @types/node-cron
```

**Note:** Jobs can still be run manually via API without node-cron installed.

---

## Available Jobs

### 1. Late Check-in Alert Job

**Purpose:** Generate alerts for staff who haven't checked in by the threshold time

**Default Schedule:** Daily at 10:00 AM
**Environment Variable:** `CRON_LATE_CHECKIN=0 10 * * *`

**Threshold:** 9:30 AM (configurable)

**What it does:**
- Checks all active staff
- Identifies those without attendance record for today
- Creates "late_checkin" alert if past threshold time
- Severity: LOW
- Priority: 2

**Manual Trigger:**
```bash
POST /v1/jobs/run/late-checkin
Authorization: Bearer <super-admin-token>
```

---

### 2. Missing Checkout Alert Job

**Purpose:** Generate alerts for staff who forgot to check out

**Default Schedule:** Daily at 11:00 PM
**Environment Variable:** `CRON_MISSING_CHECKOUT=0 23 * * *`

**What it does:**
- Finds attendance records with check-in but no check-out
- Creates "missing_checkout" alert for each
- Severity: MEDIUM
- Priority: 2

**Manual Trigger:**
```bash
POST /v1/jobs/run/missing-checkout
Authorization: Bearer <super-admin-token>
```

---

### 3. Expired Alert Cleanup Job

**Purpose:** Auto-dismiss old unacknowledged alerts

**Default Schedule:** Every hour
**Environment Variable:** `CRON_EXPIRED_CLEANUP=0 * * * *`

**Configuration:** `ALERT_EXPIRY_HOURS=24` (default)

**What it does:**
- Finds active alerts older than expiry time
- Changes status from "active" to "dismissed"
- Prevents alert clutter

**Manual Trigger:**
```bash
POST /v1/jobs/run/expired-cleanup
Authorization: Bearer <super-admin-token>
```

---

### 4. Old Alert Cleanup Job

**Purpose:** Delete old resolved/dismissed alerts (database cleanup)

**Default Schedule:** Daily at 2:00 AM
**Environment Variable:** `CRON_OLD_CLEANUP=0 2 * * *`

**Configuration:** `ALERT_RETENTION_DAYS=30` (default)

**What it does:**
- Finds resolved/dismissed alerts older than retention period
- Permanently deletes them from database
- Keeps database size manageable

**Manual Trigger:**
```bash
POST /v1/jobs/run/old-cleanup
Authorization: Bearer <super-admin-token>
```

---

## Configuration

### Environment Variables

Add to `.env` file:

```env
# Alert Configuration
ALERT_EXPIRY_HOURS=24
ALERT_RETENTION_DAYS=30
LATE_CHECKIN_THRESHOLD_MINUTES=30

# Scheduled Jobs (Cron Syntax)
CRON_LATE_CHECKIN=0 10 * * *          # 10:00 AM daily
CRON_MISSING_CHECKOUT=0 23 * * *      # 11:00 PM daily
CRON_EXPIRED_CLEANUP=0 * * * *        # Every hour
CRON_OLD_CLEANUP=0 2 * * *            # 2:00 AM daily
```

### Cron Syntax Reference

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7) (Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Examples:**
- `0 10 * * *` - Every day at 10:00 AM
- `30 9 * * *` - Every day at 9:30 AM
- `0 */2 * * *` - Every 2 hours
- `0 0 * * 0` - Every Sunday at midnight
- `0 9 * * 1-5` - Every weekday at 9:00 AM

---

## API Endpoints (Manual Execution)

All endpoints require Super Admin authentication.

### Get Job Status

```bash
GET /v1/jobs/status
Authorization: Bearer <super-admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Job status retrieved successfully",
  "data": {
    "enabled": true,
    "jobs": [
      {
        "name": "Late Check-in Alerts",
        "schedule": "0 10 * * *",
        "description": "Generate alerts for staff who haven't checked in"
      },
      {
        "name": "Missing Checkout Alerts",
        "schedule": "0 23 * * *",
        "description": "Generate alerts for staff who forgot to check out"
      },
      {
        "name": "Expired Alert Cleanup",
        "schedule": "0 * * * *",
        "description": "Auto-dismiss old unacknowledged alerts"
      },
      {
        "name": "Old Alert Cleanup",
        "schedule": "0 2 * * *",
        "description": "Delete old resolved/dismissed alerts"
      }
    ]
  }
}
```

### Run Late Check-in Job

```bash
POST /v1/jobs/run/late-checkin
Authorization: Bearer <super-admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Late check-in job completed successfully",
  "data": {
    "alertsCreated": 5,
    "timestamp": "2026-01-17T10:00:00Z"
  }
}
```

### Run Missing Checkout Job

```bash
POST /v1/jobs/run/missing-checkout
Authorization: Bearer <super-admin-token>
```

### Run Expired Alert Cleanup

```bash
POST /v1/jobs/run/expired-cleanup
Authorization: Bearer <super-admin-token>
```

### Run Old Alert Cleanup

```bash
POST /v1/jobs/run/old-cleanup
Authorization: Bearer <super-admin-token>
```

### Run All Jobs (Testing)

```bash
POST /v1/jobs/run/all
Authorization: Bearer <super-admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "All daily jobs completed successfully",
  "data": {
    "lateCheckin": 5,
    "missingCheckout": 12,
    "expiredCleanup": 8,
    "timestamp": "2026-01-17T10:00:00Z"
  }
}
```

---

## Server Startup

Jobs are automatically initialized when the server starts:

```typescript
// In server.ts
import JobController from "./jobs/JobController";

connectDb().then(() => {
  console.log("Mongo connected");

  // Initialize scheduled jobs
  const jobController = new JobController();
  jobController.initializeJobs();

  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
});
```

**Console Output:**
```
Mongo connected
[AlertJobs] node-cron loaded successfully
[AlertJobs] Initializing scheduled alert jobs...
[AlertJobs] Late check-in job scheduled: 0 10 * * *
[AlertJobs] Missing checkout job scheduled: 0 23 * * *
[AlertJobs] Expired alert cleanup scheduled: 0 * * * *
[AlertJobs] Old alert cleanup scheduled: 0 2 * * *
[AlertJobs] All scheduled jobs initialized successfully
Server started on port 3001
```

---

## Monitoring Jobs

### Check Logs

Jobs log their execution:

```
[AlertJobs] Running late check-in job...
[AlertJobs] Late check-in job completed - 5 alerts created

[AlertJobs] Running missing checkout job...
[AlertJobs] Missing checkout job completed - 12 alerts created

[AlertJobs] Running expired alert cleanup...
[AlertJobs] Expired alert cleanup completed - 8 alerts expired
```

### Check Alert Statistics

Use the alerts stats endpoint to see generated alerts:

```bash
GET /v1/alerts/stats
Authorization: Bearer <token>
```

---

## Development & Testing

### Testing Jobs Locally

1. **Manual Trigger:**
   ```bash
   # Run specific job
   POST /v1/jobs/run/late-checkin

   # Run all jobs at once
   POST /v1/jobs/run/all
   ```

2. **Change Schedule for Testing:**
   ```env
   # Run every minute instead of daily
   CRON_LATE_CHECKIN=* * * * *
   ```

3. **Disable Scheduled Jobs:**
   - Don't install node-cron
   - Jobs will still be available via API
   - Useful for development

### Without node-cron Installed

If node-cron is not installed:

```
[AlertJobs] node-cron not installed. Install with: npm install node-cron @types/node-cron
[AlertJobs] Cannot initialize scheduled jobs - node-cron not available
[AlertJobs] Jobs can still be run manually via job methods
```

Jobs can still be triggered via API endpoints.

---

## Production Deployment

### 1. Install Dependencies

```bash
npm install node-cron @types/node-cron
```

### 2. Configure Environment

```env
# Production schedule
CRON_LATE_CHECKIN=0 10 * * *          # 10 AM
CRON_MISSING_CHECKOUT=0 23 * * *      # 11 PM
CRON_EXPIRED_CLEANUP=0 * * * *        # Every hour
CRON_OLD_CLEANUP=0 2 * * *            # 2 AM

# Alert configuration
ALERT_EXPIRY_HOURS=24
ALERT_RETENTION_DAYS=30
```

### 3. Start Server

```bash
npm start
```

### 4. Verify Jobs Running

```bash
# Check job status
curl -X GET http://your-domain.com/v1/jobs/status \
  -H "Authorization: Bearer <super-admin-token>"
```

### 5. Monitor Logs

Check application logs for job execution:

```bash
tail -f logs/application.log | grep AlertJobs
```

---

## Troubleshooting

### Jobs Not Running

1. **Check if node-cron is installed:**
   ```bash
   npm list node-cron
   ```

2. **Check server logs:**
   ```
   [AlertJobs] node-cron loaded successfully ✅
   [AlertJobs] All scheduled jobs initialized successfully ✅
   ```

3. **Verify environment variables:**
   ```bash
   echo $CRON_LATE_CHECKIN
   ```

### Alerts Not Being Created

1. **Check database connection:**
   - Jobs require database access
   - Verify MongoDB is connected

2. **Check staff data:**
   - Jobs require active staff records
   - Verify staff have business assignments

3. **Check attendance data:**
   - Missing checkout job requires attendance records
   - Verify attendance collection has data

4. **Run job manually for debugging:**
   ```bash
   POST /v1/jobs/run/late-checkin
   ```
   Check response for errors

### Too Many Alerts

1. **Adjust thresholds:**
   ```env
   LATE_CHECKIN_THRESHOLD_MINUTES=60  # More lenient
   ```

2. **Increase expiry time:**
   ```env
   ALERT_EXPIRY_HOURS=12  # Alerts expire faster
   ```

3. **Run cleanup more often:**
   ```env
   CRON_EXPIRED_CLEANUP=0 */2 * * *  # Every 2 hours
   ```

---

## Architecture

### Job Scheduler (`AlertJobScheduler.ts`)

- Manages all scheduled jobs
- Initializes cron schedules on startup
- Provides manual execution methods
- Handles errors and logging

### Job Controller (`JobController.ts`)

- Provides API endpoints for manual triggers
- Restricted to Super Admin only
- Returns job execution results
- Initializes scheduler on server startup

### Job Router (`JobRouter.ts`)

- Defines API routes for job management
- Applies authentication and authorization
- Mounted at `/v1/jobs/`

---

## Future Enhancements

Potential improvements:

1. **Job History:**
   - Store job execution history in database
   - Track success/failure rates
   - Show last run time in status endpoint

2. **Dynamic Scheduling:**
   - Admin UI to change schedules
   - Per-business job configurations
   - Pause/resume jobs via API

3. **Notifications:**
   - Email notifications on job failures
   - Slack/webhook integration
   - Alert when jobs haven't run

4. **Advanced Scheduling:**
   - Business hours only (skip holidays)
   - Different schedules per business
   - Timezone-aware scheduling

5. **Job Queue:**
   - Use Bull or BullMQ for robust queue
   - Retry failed jobs
   - Job prioritization

---

## Security

### API Security

- All job endpoints require authentication
- Only Super Admin can trigger jobs
- Business scoping not applied (jobs run globally)
- Audit logging recommended

### Data Security

- Jobs only create/update alerts, never delete user data
- Cleanup jobs only delete old alerts (30+ days)
- No sensitive data in job logs

---

## Performance Considerations

### Database Load

Jobs query the database:
- Late check-in: Queries all active staff (~1000 records)
- Missing checkout: Queries today's attendance (~1000 records)
- Alert cleanup: Updates/deletes alerts

**Optimization:**
- Jobs run during off-peak hours
- Indexes on relevant fields (staff.isActive, attendance.date)
- Batch operations where possible

### Expected Performance

- Late check-in job: ~2-5 seconds for 1000 staff
- Missing checkout job: ~2-5 seconds for 1000 attendance records
- Cleanup jobs: ~1-2 seconds for 10,000 alerts

---

## Questions?

For issues or questions:
1. Check server logs
2. Test jobs manually via API
3. Verify environment configuration
4. Check database connectivity

---

**Document Version:** 1.0
**Last Updated:** 2026-01-17
**Related:** Phase 3 - Control Room Enhancement
