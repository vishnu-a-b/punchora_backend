# API Documentation - New Features

## Attendance Enhancements (December 2025)

### Overview
Enhanced attendance tracking with idempotency, location flagging, and duplicate prevention improvements.

---

## Attendance Endpoints

### 1. Mark Attendance (Enhanced)

**Endpoint:** `POST /v1/attendance/mark`

**Description:** Mark attendance with enhanced location tracking and idempotency support

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```javascript
{
  staff: string,              // Staff ID
  photo: File,                // Photo file (required)
  checkIn: boolean,           // true for check-in, false for check-out
  checkInLocation: JSON,      // Location data (for check-in)
  checkOutLocation: JSON,     // Location data (for check-out)
  date: Date,
  idempotencyKey: string      // NEW: Optional unique key for duplicate prevention
}
```

**Location Object Structure:**
```javascript
{
  latitude: number,           // Required
  longitude: number,          // Required
  accuracy: number,           // NEW: GPS accuracy in meters
  altitude: number,           // NEW: Elevation
  heading: number,            // NEW: Direction (0-360)
  speed: number,              // NEW: Speed in m/s
  timestamp: number,          // NEW: Location capture timestamp
  mocked: boolean             // NEW: Flag for fake/spoofed GPS
}
```

**Example Request:**
```javascript
const formData = new FormData();
formData.append('staff', staffId);
formData.append('photo', photoFile);
formData.append('checkIn', 'true');
formData.append('checkInLocation', JSON.stringify({
  latitude: 12.9716,
  longitude: 77.5946,
  accuracy: 8.2,
  altitude: 920.5,
  heading: 45,
  speed: 0.5,
  timestamp: Date.now(),
  mocked: false
}));
formData.append('idempotencyKey', `${staffId}_checkIn_${Date.now()}`);

await fetch('/v1/attendance/mark', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "staff": "507f1f77bcf86cd799439012",
    "date": "2025-12-17T10:30:00.000Z",
    "checkInTime": "2025-12-17T10:30:00.000Z",
    "checkInLocation": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "accuracy": 8.2,
      "altitude": 920.5,
      "heading": 45,
      "speed": 0.5,
      "timestamp": 1734436200000,
      "mocked": false
    },
    "checkInPhoto": "https://api.example.com/attendance/1734436200-photo.jpg",
    "idempotencyKey": "staff123_checkIn_1734436200000",
    "flagged": false,
    "status": "checkedIn",
    "createdAt": "2025-12-17T10:30:00.000Z",
    "updatedAt": "2025-12-17T10:30:00.000Z"
  },
  "message": "Attendance marked successfully"
}
```

**Response (Flagged - 201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "staff": "507f1f77bcf86cd799439012",
    "checkInLocation": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "accuracy": 150.5,
      "mocked": false
    },
    "flagged": true,
    "flagReason": "Low GPS accuracy (150.5m)",
    "status": "checkedIn"
  },
  "message": "Attendance marked successfully (flagged for review)"
}
```

**Response (Duplicate - 200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "note": "This request was already processed"
  },
  "message": "Attendance already recorded"
}
```

**Response (Rate Limited - 400):**
```json
{
  "success": false,
  "error": "You have a recent marking. Wait for 1 minute and try again!"
}
```

---

### 2. Get Flagged Attendance Records

**Endpoint:** `GET /v1/attendance/flagged/list`

**Description:** Retrieve all flagged attendance records for review

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
startDate: Date (optional) - Filter from this date
endDate: Date (optional)   - Filter to this date
```

**Example Request:**
```javascript
GET /v1/attendance/flagged/list?startDate=2025-12-01T00:00:00.000Z&endDate=2025-12-17T23:59:59.999Z
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "staff": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "date": "2025-12-17T10:30:00.000Z",
      "checkInTime": "2025-12-17T10:30:00.000Z",
      "checkInLocation": {
        "latitude": 12.9716,
        "longitude": 77.5946,
        "accuracy": 150.5,
        "mocked": false
      },
      "flagged": true,
      "flagReason": "Low GPS accuracy (150.5m)",
      "status": "checkedIn",
      "createdAt": "2025-12-17T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "staff": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "date": "2025-12-16T14:20:00.000Z",
      "checkInTime": "2025-12-16T14:20:00.000Z",
      "checkInLocation": {
        "latitude": 12.9716,
        "longitude": 77.5946,
        "mocked": true
      },
      "flagged": true,
      "flagReason": "Mocked GPS detected - possible location spoofing",
      "status": "present"
    }
  ]
}
```

---

### 3. Clear Attendance Flag

**Endpoint:** `PUT /v1/attendance/flagged/:id/clear`

**Description:** Clear the flag from an attendance record after review

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
```
id: string - Attendance record ID
```

**Request Body:**
```json
{
  "note": "Reviewed and approved - GPS was temporarily inaccurate"
}
```

**Example Request:**
```javascript
PUT /v1/attendance/flagged/507f1f77bcf86cd799439011/clear
Content-Type: application/json

{
  "note": "Reviewed with staff, GPS issue was due to underground parking"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "staff": "507f1f77bcf86cd799439012",
    "date": "2025-12-17T10:30:00.000Z",
    "flagged": false,
    "flagReason": "Reviewed with staff, GPS issue was due to underground parking",
    "status": "checkedIn",
    "updatedAt": "2025-12-17T15:00:00.000Z"
  }
}
```

---

## Activity Endpoints

### 1. Start Activity

**Endpoint:** `POST /v1/activity/start`

**Description:** Start a new activity (break, trip, etc.)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```javascript
{
  type: string,                    // tea-break, lunch-break, washroom, care-or-onsite, trip, other
  startTime: Date,                 // Optional (defaults to now)
  location: string,                // Optional (for care-or-onsite, trip)
  reason: string,                  // Optional
  photo: File,                     // Optional
  vehiclePhoto: File,              // Optional (for trip)
  meterReadingStart: number,       // Optional (for trip)
  gpsLocation: JSON                // Optional GPS coordinates
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Activity started successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "staff": "507f1f77bcf86cd799439012",
    "business": "507f1f77bcf86cd799439015",
    "type": "tea-break",
    "status": "started",
    "startTime": "2025-12-17T11:00:00.000Z",
    "createdAt": "2025-12-17T11:00:00.000Z"
  }
}
```

### 2. End Activity

**Endpoint:** `PUT /v1/activity/:id/end`

**Request Body:**
```json
{
  "endTime": "2025-12-17T11:15:00.000Z",
  "meterReadingEnd": 12345
}
```

### 3. Get My Activities

**Endpoint:** `GET /v1/activity/my-activities`

**Query Parameters:**
```
skip: number
limit: number
startDate: Date
endDate: Date
type: string
status: string
```

### 4. Get Business Activities (Admin)

**Endpoint:** `GET /v1/activity/business`

### 5. Get Activity Statistics

**Endpoint:** `GET /v1/activity/stats?startDate=...&endDate=...`

---

## Flagging Rules

Attendance records are automatically flagged when:

1. **Mocked GPS Detected**
   - `location.mocked === true`
   - Flag Reason: "Mocked GPS detected - possible location spoofing"

2. **Low GPS Accuracy**
   - `location.accuracy > 100` meters
   - Flag Reason: "Low GPS accuracy (X.Xm)"

3. **User in Motion**
   - `location.speed > 5` m/s
   - Flag Reason: "User in motion (X.X m/s)"

Multiple flags can be combined, separated by semicolons.

---

## Idempotency

The `idempotencyKey` field prevents duplicate submissions:

- **Format:** `{staffId}_{action}_{timestamp}`
- **Example:** `staff123_checkIn_1734436200000`
- **Behavior:** If same key is sent twice, returns existing record instead of creating duplicate
- **Index:** Unique sparse index ensures database-level enforcement

---

## Rate Limiting

- **Duplicate Prevention:** 1 minute cooldown between markings
- **Previous Limit:** 2 minutes (now reduced to 1 minute)

---

## Migration

Before using these features, run the migration:

```bash
cd backend/migrations
mongosh <connection-string> --file 001_attendance_enhancements.js
```

Or using Node.js:

```bash
cd backend
npx ts-node migrations/run-migration.ts
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | You have a recent marking. Wait for 1 minute and try again! | Rate limit hit |
| 400 | Staff record not found | Invalid staff ID |
| 401 | Unauthorized | Missing or invalid token |
| 404 | Attendance not found | Invalid attendance ID |
| 500 | Internal server error | Server error |

---

## Testing

### Test Idempotency
```bash
# Send same request twice with same idempotencyKey
curl -X POST http://localhost:3002/v1/attendance/mark \
  -H "Authorization: Bearer <token>" \
  -F "idempotencyKey=test_1234567890" \
  -F "staff=<staffId>" \
  # ... other fields

# Second request should return existing record
```

### Test Flagging
```bash
# Send request with mocked GPS
curl -X POST http://localhost:3002/v1/attendance/mark \
  -H "Authorization: Bearer <token>" \
  -F "checkInLocation={\"latitude\":12.9716,\"longitude\":77.5946,\"mocked\":true}" \
  # ... other fields

# Should return flagged: true
```

---

## Frontend Integration

See `/admin_dashboard/src/components/attendance/FlaggedAttendanceHome.tsx` for example implementation.

Access at:
- Super Admin: `/super-admin/flagged-attendance`
- Business Admin: `/business-admin/flagged-attendance`
