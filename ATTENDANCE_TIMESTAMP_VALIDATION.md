# Attendance Controller Enhancement for Timestamp Validation

## Overview
This document describes how to enhance the existing attendance controller to validate timestamps and detect time manipulation.

## Changes Needed in AttendanceController

### 1. Import the Time Sync Controller Functions

```typescript
import TimeSyncController from "../timeSync/controllers/TimeSyncController";
```

### 2. Add Timestamp Validation to Mark Attendance

In your existing `mark` or `markViaPhoto` method, add validation before creating the attendance record:

```typescript
// Example enhancement to existing attendance marking method
mark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ... existing validation code ...

    // NEW: Validate timestamp if metadata is provided
    if (req.body.timestampMeta) {
      const metadata = JSON.parse(req.body.timestampMeta);
      const timestamp = req.body.checkInTime || req.body.checkOutTime;

      // Validate the timestamp
      const serverTime = new Date();
      const clientTime = new Date(timestamp);
      const timeDiff = Math.abs(serverTime.getTime() - clientTime.getTime()) / 1000;

      // Maximum allowed difference: 5 minutes (300 seconds)
      const maxDiff = 300;

      if (timeDiff > maxDiff) {
        throw new BadRequestError({
          error: `Timestamp is ${timeDiff.toFixed(0)} seconds off from server time. Maximum allowed is ${maxDiff} seconds.`,
        });
      }

      // Log warnings if confidence is low
      if (metadata.confidence === "low" || (metadata.warnings && metadata.warnings.length > 0)) {
        console.warn(`⚠️ Low confidence timestamp for staff ${req.body.staff}:`, {
          timeDiff,
          confidence: metadata.confidence,
          warnings: metadata.warnings,
          gpsTime: metadata.gpsTime,
        });

        // Optionally, store the metadata in the attendance record for audit
        req.body.timestampValidation = {
          confidence: metadata.confidence,
          warnings: metadata.warnings,
          timeDifference: timeDiff,
          hasGpsTime: !!metadata.gpsTime,
        };
      }
    }

    // ... continue with existing attendance creation code ...
  } catch (e: any) {
    next(e);
  }
};
```

### 3. Optional: Add Timestamp Validation Field to Attendance Model

To store timestamp validation data for auditing:

```typescript
// In attendance schema
timestampValidation: {
  confidence: { type: String, enum: ["high", "medium", "low"] },
  warnings: [{ type: String }],
  timeDifference: { type: Number }, // seconds
  hasGpsTime: { type: Boolean },
},
```

## Integration Steps

1. **Add Time Sync Router to Main App**

In your main `app.ts` or `index.ts`:

```typescript
import timeSyncRouter from "./modules/timeSync/Routers/TimeSyncRouter";

// Add route
app.use("/v1/time-sync", timeSyncRouter);
```

2. **Update Attendance Controller**

Add timestamp validation logic as shown above.

3. **Test the Endpoints**

```bash
# Get server time
curl http://localhost:3000/v1/time-sync

# Validate a timestamp
curl -X POST http://localhost:3000/v1/time-sync/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "timestamp": "2025-11-05T10:30:00.000Z",
    "metadata": {
      "deviceTime": "2025-11-05T10:30:05.000Z",
      "secureTime": "2025-11-05T10:30:00.000Z",
      "gpsTime": "2025-11-05T10:30:01.000Z",
      "confidence": "high",
      "warnings": []
    }
  }'
```

## Security Benefits

1. **GPS Time Verification**: GPS timestamps cannot be manipulated by changing device time
2. **Server Time Sync**: Validates timestamps against server time
3. **Confidence Scoring**: Identifies suspicious submissions
4. **Audit Trail**: Logs all warnings and low-confidence submissions
5. **Flexible Validation**: Allows some tolerance for network delays while preventing major manipulation

## Monitoring and Alerts

Consider adding alerts for:
- High number of low-confidence submissions from a user
- Repeated timestamp validation failures
- Large time differences between device and GPS time
- Users with no GPS time submissions (possible GPS spoofing avoidance)
