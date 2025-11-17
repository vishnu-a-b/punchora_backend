# Offline Face Recognition - Backend Setup Guide

This guide covers setting up the NEW ONNX-based offline face recognition system.

**IMPORTANT:** This does NOT modify any existing face-api.js code. All new endpoints use the `/v1/offline-face/` prefix.

---

## 1. Install Required npm Packages

```bash
cd backend

# Install ONNX Runtime for Node.js
npm install onnxruntime-node

# Install Sharp for image processing
npm install sharp

# Install UUID for generating unique IDs
npm install uuid
npm install --save-dev @types/uuid

# (Optional) If not already installed
npm install mongoose express
```

---

## 2. Download ONNX Model

Download the MobileFaceNet ONNX model and place it in the models folder:

```bash
# Create models directory if it doesn't exist
mkdir -p backend/src/models

# Download MobileFaceNet model (example URLs - use your preferred source)
cd backend/src/models

# Option 1: Download from ONNX Model Zoo
# Visit: https://github.com/onnx/models/tree/main/vision/body_analysis/arcface
# Download: mobilefacenet.onnx or arcface_r100_v1.onnx

# Option 2: Use a pre-converted model
# Search for "MobileFaceNet ONNX" or "ArcFace ONNX model"
```

**Model Requirements:**
- Input: 112x112 RGB image
- Output: 128-dimensional embedding (for MobileFaceNet)
- Format: ONNX (.onnx file)

---

## 3. Create Upload Directory

```bash
# Create directory for staff face photos
mkdir -p backend/uploads/staff_face_photos
```

---

## 4. Update Attendance Model (OPTIONAL)

If you want to track the source of attendance records, add a `source` field to your existing Attendance model:

**File:** `backend/src/modules/attendance/models/Attendance.ts`

```typescript
// ADD this field to your schema
source: {
  type: String,
  enum: ['face_api', 'offline_mobile', 'manual'],
  default: 'face_api',
},
```

This allows you to differentiate between:
- `face_api`: Traditional face-api.js attendance
- `offline_mobile`: New ONNX offline mobile attendance
- `manual`: Manual attendance entry

---

## 5. Start the Server

```bash
cd backend
npm run dev
```

---

## 6. Test the New Endpoints

### Test 1: Upload Staff Photo & Generate Embedding

```bash
# Replace with actual staffId from your database
curl -X POST http://localhost:3002/v1/offline-face/upload-staff-photo \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "507f1f77bcf86cd799439011",
    "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Staff face embedding created successfully",
  "data": {
    "id": "...",
    "staffId": "507f1f77bcf86cd799439011",
    "photoUrl": "/uploads/staff_face_photos/...",
    "embeddingDimensions": 128,
    "createdAt": "2025-11-15T..."
  }
}
```

### Test 2: Get Staff Embeddings (for sync)

```bash
curl http://localhost:3002/v1/offline-face/staff-embeddings?page=1&limit=10
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "staffId": "...",
      "staffName": "John Doe",
      "employeeId": "EMP001",
      "embedding": [0.123, -0.456, ...], // 128 numbers
      "photoUrl": "/uploads/staff_face_photos/...",
      "modelName": "MobileFaceNet",
      "embeddingVersion": "v1.0",
      "updatedAt": 1700000000000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasMore": true
  }
}
```

### Test 3: Sync Attendance from Mobile

```bash
curl -X POST http://localhost:3002/v1/offline-face/sync-attendance \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {
        "localId": "uuid-1",
        "staffId": "507f1f77bcf86cd799439011",
        "timestamp": 1700000000000,
        "type": "IN",
        "deviceId": "device-123"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "results": [
    {
      "localId": "uuid-1",
      "status": "success",
      "serverId": "673..."
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0
  }
}
```

---

## 7. Directory Structure (NEW Files Only)

```
backend/
├── src/
│   ├── models/
│   │   └── MobileFaceNet.onnx           # NEW: ONNX model file
│   ├── modules/
│   │   ├── faceDescriptor/              # EXISTING: face-api.js (unchanged)
│   │   └── offlineFaceRecognition/      # NEW: ONNX system
│   │       ├── models/
│   │       │   └── StaffFaceEmbedding.ts
│   │       ├── services/
│   │       │   ├── OnnxFaceService.ts
│   │       │   └── StaffPhotoService.ts
│   │       ├── controllers/
│   │       │   ├── StaffEmbeddingController.ts
│   │       │   └── OfflineAttendanceController.ts
│   │       └── routes/
│   │           └── OfflineFaceRouter.ts
│   └── routes/
│       └── index.ts                     # MODIFIED: Added 2 lines
└── uploads/
    └── staff_face_photos/               # NEW: Photo storage directory
```

---

## 8. API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/offline-face/upload-staff-photo` | POST | Upload photo + generate embedding |
| `/v1/offline-face/staff-embeddings` | GET | Get staff embeddings (paged) |
| `/v1/offline-face/staff-list` | GET | Get minimal staff list |
| `/v1/offline-face/sync-attendance` | POST | Batch upload attendance |
| `/v1/offline-face/staff-embedding/:staffId` | DELETE | Delete staff embedding |
| `/v1/offline-face/attendance-status/:batchId` | GET | Check sync batch status |

---

## 9. Troubleshooting

### Error: "ONNX model not found"
- Download MobileFaceNet.onnx model
- Place in `backend/src/models/MobileFaceNet.onnx`
- Restart server

### Error: "Cannot find module 'onnxruntime-node'"
```bash
npm install onnxruntime-node
```

### Error: "Cannot find module 'sharp'"
```bash
npm install sharp
```

### Embeddings not generating
- Check model file path in `OnnxFaceService.ts`
- Ensure model input size matches (112x112)
- Check console logs for ONNX errors

---

## 10. Next Steps

1. ✅ Backend is ready
2. ⏭️  Set up frontend (Expo app) with ONNX Runtime Mobile
3. ⏭️  Test offline recognition end-to-end
4. ⏭️  Deploy to production

---

## Notes

- **Separation**: All new code is in `offlineFaceRecognition/` module
- **Compatibility**: Existing face-api.js code is untouched
- **Extensibility**: Easy to add authentication middleware to routes
- **Performance**: ONNX inference is fast (~10-50ms per image on modern CPU)
- **Mobile Sync**: Embeddings are compatible with mobile ONNX Runtime

For mobile app setup, see: `pagar_lens/OFFLINE_FACE_SETUP.md`
