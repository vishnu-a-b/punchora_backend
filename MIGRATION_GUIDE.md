# ONNX Face Embedding Migration Guide

## Overview

This guide explains how to migrate existing user photos from `backend/public/users/` to the new ONNX-based face recognition system.

The migration script will:
1. Scan all images in `backend/public/users/`
2. Generate 128-dimensional ONNX embeddings for each face
3. Link embeddings to Staff records in the database
4. Store embeddings in the `StaffFaceEmbedding` collection

---

## Prerequisites

### 1. Install Dependencies

All required packages should already be installed:

```bash
cd backend
npm install
```

Required packages:
- `onnxruntime-node` - ONNX Runtime for Node.js
- `sharp` - Image processing
- `uuid` - Unique ID generation
- `mongoose` - MongoDB ODM

### 2. Download ONNX Model

**IMPORTANT:** You must download the MobileFaceNet ONNX model before running the migration.

**Option A: Download MobileFaceNet (Recommended)**
```bash
cd backend/src/models
# Download MobileFaceNet.onnx from a trusted source
# Place it in backend/src/models/MobileFaceNet.onnx
```

**Option B: Use ArcFace (Alternative)**
```bash
cd backend/src/models
wget https://github.com/onnx/models/raw/main/vision/body_analysis/arcface/model/arcfaceresnet100-8.onnx
mv arcfaceresnet100-8.onnx MobileFaceNet.onnx
```

**Verify model exists:**
```bash
ls -la backend/src/models/MobileFaceNet.onnx
```

### 3. Configure MongoDB Connection

Set your MongoDB connection string in `.env`:

```bash
MONGODB_URI=mongodb://localhost:27017/punchora
```

Or the script will use the default: `mongodb://localhost:27017/punchora`

---

## Running the Migration

### Step 1: Dry Run (Recommended First)

Test the migration without saving to the database:

```bash
npm run migrate:onnx:dry-run
```

This will:
- ✅ Connect to MongoDB (read-only)
- ✅ Load the ONNX model
- ✅ Scan all images
- ✅ Process embeddings
- ❌ **NOT save** to database

Review the output to ensure everything works correctly.

### Step 2: Run Full Migration

Once you're satisfied with the dry run:

```bash
npm run migrate:onnx
```

This will process all images and save embeddings to the database.

---

## Migration Output

### Expected Console Output

```
🚀 Starting ONNX Embedding Migration
============================================================
✅ Connected to MongoDB
✅ ONNX service initialized
📁 Found 101 images in /path/to/backend/public/users
🔍 Mapping images to staff members...
👥 Found 45 users with photos
👔 Found 42 staff records
✅ Linked to staff: 40
⚠️  Not linked to staff: 61

📦 Processing batch 1/11 (10 images)
🔄 Processing 1746083531065-17460835140252523382926180158756.jpg...
✅ Generated 128D embedding for /path/to/image.jpg
✅ Saved embedding for John Doe (1746083531065-17460835140252523382926180158756.jpg)
...

============================================================
📊 MIGRATION SUMMARY
============================================================
Total images:        101
✅ Successful:       40
⏭️  Skipped:          58
❌ Failed:           3
============================================================

⚠️  ERRORS:
  1. corrupted-image.jpg: Failed to preprocess image for face recognition
  2. blurry-face.jpg: Invalid embedding generated
  3. no-face.jpg: No face detected
```

### Understanding the Results

| Status | Meaning |
|--------|---------|
| **Successful** | Embedding generated and saved to database |
| **Skipped** | Already has embedding OR not linked to staff record |
| **Failed** | Error during processing (corrupted image, no face detected, etc.) |

---

## What Gets Created

### Database Collection: `stafffaceembeddings`

Each successfully processed image creates a document like this:

```javascript
{
  _id: ObjectId("..."),
  staffId: ObjectId("507f1f77bcf86cd799439011"),
  modelName: "MobileFaceNet",
  embedding: [0.123, -0.456, 0.789, ...], // 128 numbers
  embeddingVersion: "v1.0",
  photoUrl: "/users/1746083531065-17460835140252523382926180158756.jpg",
  createdAt: ISODate("2025-11-17T12:00:00.000Z"),
  updatedAt: ISODate("2025-11-17T12:00:00.000Z")
}
```

---

## Configuration Options

You can modify the script behavior by editing `src/scripts/migrateToOnnxEmbeddings.ts`:

```typescript
// Line 25-27
const BATCH_SIZE = 10; // Process N images at a time
const DRY_RUN = false; // Set to true for testing

// Line 183 (similarity threshold)
// Adjust in OnnxFaceService.ts if needed
```

---

## Troubleshooting

### Error: "ONNX model not found"

**Solution:**
1. Download MobileFaceNet.onnx (see Prerequisites section)
2. Place it in `backend/src/models/MobileFaceNet.onnx`
3. Verify with: `ls backend/src/models/MobileFaceNet.onnx`

### Error: "MongoDB connection failed"

**Solution:**
1. Ensure MongoDB is running: `mongod` or `brew services start mongodb-community`
2. Check `.env` for correct `MONGODB_URI`
3. Test connection: `mongosh mongodb://localhost:27017/punchora`

### Error: "Failed to preprocess image"

**Possible causes:**
- Corrupted image file
- Invalid image format
- Insufficient permissions

**Solution:**
```bash
# Check image file
file backend/public/users/problematic-image.jpg

# Verify permissions
ls -la backend/public/users/problematic-image.jpg

# Try opening with sharp manually
node -e "const sharp = require('sharp'); sharp('path/to/image.jpg').metadata().then(console.log)"
```

### Many images "Not linked to staff"

This means the images exist in `/users/` but are not referenced in any User's `photos` array.

**Solutions:**

1. **Manually link images to users** (if you know which images belong to which users)
2. **Process them anyway** by modifying the script to create embeddings without staff linkage
3. **Clean up unused images** if they're no longer needed

### Low Success Rate

If many images fail:

1. **Check image quality** - Blurry or low-resolution images may fail
2. **Verify faces are visible** - Images without clear faces will fail
3. **Review error messages** - Check the ERRORS section in the output
4. **Try a different ONNX model** - Some models are more robust

---

## Advanced Usage

### Process Only New Images

The script automatically skips images that already have embeddings. To force re-processing:

```typescript
// Comment out this section in migrateToOnnxEmbeddings.ts (lines 154-161)
// if (mapping.staffId) {
//   const existing = await StaffFaceEmbedding.findOne({
//     staffId: mapping.staffId,
//   });
//   if (existing) { ... }
// }
```

### Process Specific Images

Modify the `getImageFiles()` method to filter by pattern:

```typescript
async getImageFiles(): Promise<string[]> {
  const files = fs.readdirSync(IMAGES_DIR);
  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    // Only process files starting with "1746"
    return [".jpg", ".jpeg", ".png"].includes(ext) && file.startsWith("1746");
  });
  return imageFiles;
}
```

### Custom Batch Size

For faster processing on powerful servers:

```typescript
const BATCH_SIZE = 50; // Process 50 at a time
```

For limited memory environments:

```typescript
const BATCH_SIZE = 5; // Process 5 at a time
```

---

## Verification

After migration, verify the results:

### 1. Check Database

```javascript
// In MongoDB shell or Compass
db.stafffaceembeddings.countDocuments()
// Should match the "Successful" count from migration

db.stafffaceembeddings.findOne()
// Verify structure and embedding array length (should be 128)
```

### 2. Test API Endpoint

```bash
# Get all embeddings
curl -X GET "http://localhost:3002/v1/offline-face/staff-embeddings?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Face Recognition

Use the mobile app to test face recognition with the new embeddings.

---

## Rollback

If you need to undo the migration:

```javascript
// In MongoDB shell
db.stafffaceembeddings.deleteMany({
  embeddingVersion: "v1.0",
  createdAt: { $gte: ISODate("2025-11-17T00:00:00.000Z") }
})
```

Or delete all embeddings:

```javascript
db.stafffaceembeddings.deleteMany({})
```

---

## Next Steps

After successful migration:

1. ✅ **Test the `/v1/offline-face/staff-embeddings` API endpoint**
2. ✅ **Sync embeddings to mobile app**
3. ✅ **Test offline face recognition** on mobile devices
4. ✅ **Monitor performance** and accuracy
5. ✅ **Set up regular sync** for new staff photos

---

## Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review error messages in the console output
3. Check backend logs for more details
4. Verify all prerequisites are met

---

## Summary Checklist

- [ ] MongoDB is running and accessible
- [ ] ONNX model downloaded to `backend/src/models/MobileFaceNet.onnx`
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` configured with `MONGODB_URI`
- [ ] Dry run completed successfully (`npm run migrate:onnx:dry-run`)
- [ ] Full migration completed (`npm run migrate:onnx`)
- [ ] Embeddings verified in database
- [ ] API endpoint tested
- [ ] Mobile app synced and tested

---

**Total Images to Process:** 101

**Estimated Time:** 5-10 minutes (depending on system performance)

**Storage Impact:** ~13 KB per embedding (101 images × 13 KB ≈ 1.3 MB)

Good luck with your migration! 🚀
