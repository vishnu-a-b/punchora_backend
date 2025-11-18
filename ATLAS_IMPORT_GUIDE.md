# MongoDB Atlas Import Guide

## 📦 Exported Files

Your face embeddings and related data have been exported to the `exports/` directory:

### BSON Format (for mongorestore):
```
exports/dump/punchora/
├── stafffaceembeddings.bson (668 KB) - 101 face embeddings
├── stafffaceembeddings.metadata.json
├── staffs.bson - 101 staff records
├── staffs.metadata.json
├── users.bson - 202 user records
├── users.metadata.json
├── businesses.bson - 1 business record
├── businesses.metadata.json
├── departments.bson - 1 department record
└── departments.metadata.json
```

### JSON Format (for mongoimport):
```
exports/
└── stafffaceembeddings.json (1.1 MB) - 101 face embeddings in JSON array format
```

---

## 🚀 Method 1: Import Using MongoDB Compass (Easiest)

### Step 1: Connect to Atlas
1. Open MongoDB Compass
2. Get your Atlas connection string from Atlas dashboard
3. Connect using the connection string: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/`

### Step 2: Import Collections

#### Option A: Import BSON (Recommended - Preserves Data Types)

Unfortunately, Compass doesn't support BSON import directly. Use Method 2 or 3 instead.

#### Option B: Import JSON

1. In Compass, navigate to your database (e.g., `punchora`)
2. Create collection `stafffaceembeddings` if it doesn't exist
3. Click "ADD DATA" → "Import JSON or CSV file"
4. Select `exports/stafffaceembeddings.json`
5. Click "Import"

**Note:** JSON import might have issues with large arrays (embeddings). BSON is better.

---

## 🚀 Method 2: Import Using mongorestore (Recommended)

This is the best method as it preserves all data types perfectly.

### Step 1: Get Your Atlas Connection String

1. Go to MongoDB Atlas dashboard
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`)

### Step 2: Run mongorestore

```bash
# Replace with your actual connection string
mongorestore \
  --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/punchora" \
  --nsInclude="punchora.stafffaceembeddings" \
  exports/dump

# To import ALL related collections:
mongorestore \
  --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/punchora" \
  exports/dump
```

**Example:**
```bash
mongorestore \
  --uri="mongodb+srv://admin:mypassword@cluster0.abc123.mongodb.net/punchora" \
  --nsInclude="punchora.stafffaceembeddings" \
  exports/dump
```

### Step 3: Verify Import

```bash
# Count documents in Atlas
mongosh "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/punchora" \
  --eval "db.stafffaceembeddings.countDocuments()"
```

Should return: `101`

---

## 🚀 Method 3: Import Using mongoimport (For JSON)

### Import Single Collection

```bash
mongoimport \
  --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/punchora" \
  --collection=stafffaceembeddings \
  --file=exports/stafffaceembeddings.json \
  --jsonArray
```

### Verify

```bash
mongosh "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/punchora" \
  --eval "db.stafffaceembeddings.findOne()"
```

---

## 🚀 Method 4: Atlas UI Upload (For Small Datasets)

### Using Atlas Data Import Tool

1. Log in to MongoDB Atlas
2. Navigate to your cluster
3. Click "Collections"
4. Click "Add My Own Data" or "Insert Document"
5. Create database `punchora` and collection `stafffaceembeddings`
6. Use "Insert Document" → "Import JSON"
7. Paste contents from `exports/stafffaceembeddings.json`

**Warning:** This method is tedious for 101 documents. Use Method 2 instead.

---

## 📋 Import Order (If Importing All Collections)

To maintain referential integrity, import in this order:

1. ✅ **businesses** (1 document)
2. ✅ **departments** (1 document) - References businesses
3. ✅ **users** (202 documents)
4. ✅ **staffs** (101 documents) - References users, departments, businesses
5. ✅ **stafffaceembeddings** (101 documents) - References staffs

**Command to import all at once:**

```bash
mongorestore \
  --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/" \
  --db=punchora \
  exports/dump/punchora
```

---

## 🔐 Security Tips

### Don't Hardcode Credentials

Instead of putting password in command, use environment variable:

```bash
export MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/punchora"

mongorestore --uri="$MONGODB_URI" exports/dump
```

### Allow Your IP Address

1. In Atlas dashboard, go to "Network Access"
2. Click "Add IP Address"
3. Add your current IP or "Allow Access from Anywhere" (for testing only)

---

## ✅ Verification Checklist

After import, verify everything worked:

```bash
# Set your connection string
export ATLAS_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/punchora"

# Check counts
mongosh "$ATLAS_URI" --eval "
  print('Businesses:', db.businesses.countDocuments());
  print('Departments:', db.departments.countDocuments());
  print('Users:', db.users.countDocuments());
  print('Staffs:', db.staffs.countDocuments());
  print('Face Embeddings:', db.stafffaceembeddings.countDocuments());
"
```

**Expected output:**
```
Businesses: 1
Departments: 1
Users: 202
Staffs: 101
Face Embeddings: 101
```

### Check Sample Embedding

```bash
mongosh "$ATLAS_URI" --eval "
  const sample = db.stafffaceembeddings.findOne();
  print('Model:', sample.modelName);
  print('Dimensions:', sample.embedding.length);
  print('PhotoURL:', sample.photoUrl);
"
```

**Expected output:**
```
Model: ArcFace
Dimensions: 512
PhotoURL: /users/1745656686188-17456566448283117697996095885021.jpg
```

---

## 🔄 Update Backend .env

After importing to Atlas, update your backend `.env`:

```env
# Old (local):
# MONGODB_URI=mongodb://localhost:27017/punchora

# New (Atlas):
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/punchora
```

Restart your backend server to use Atlas:

```bash
npm run dev
```

---

## 📱 Update Mobile App .env

Update pagar_lens `.env` to point to your deployed backend:

```env
# If backend is on Atlas and deployed:
EXPO_PUBLIC_API_URL=https://your-backend-url.com/v1

# If backend still local but using Atlas DB:
EXPO_PUBLIC_API_URL=https://api.hr.shanthibhavan.in/v1
```

---

## 🎯 Quick Import Script

Create a file `import-to-atlas.sh`:

```bash
#!/bin/bash

# MongoDB Atlas connection string
ATLAS_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/"

echo "🚀 Importing to MongoDB Atlas..."

# Import all collections
mongorestore \
  --uri="$ATLAS_URI" \
  --db=punchora \
  --drop \
  exports/dump/punchora

echo "✅ Import completed!"

# Verify
echo "📊 Verifying counts..."
mongosh "$ATLAS_URI/punchora" --eval "
  print('Businesses:', db.businesses.countDocuments());
  print('Departments:', db.departments.countDocuments());
  print('Users:', db.users.countDocuments());
  print('Staffs:', db.staffs.countDocuments());
  print('Face Embeddings:', db.stafffaceembeddings.countDocuments());
"
```

Make it executable and run:

```bash
chmod +x import-to-atlas.sh
./import-to-atlas.sh
```

---

## 🆘 Troubleshooting

### Error: "Authentication failed"

- Check username and password in connection string
- Make sure user has read/write permissions
- Check if database name is correct

### Error: "IP not whitelisted"

- Add your IP to Atlas "Network Access"
- Or temporarily allow access from anywhere

### Error: "Collection already exists"

Use `--drop` flag to replace existing data:

```bash
mongorestore --uri="..." --drop exports/dump
```

### Import is very slow

- Atlas free tier has limited performance
- Consider upgrading to M10+ cluster
- Or import during off-peak hours

---

## 📊 File Sizes Summary

```
stafffaceembeddings.bson: 668 KB
stafffaceembeddings.json: 1.1 MB
staffs.bson: ~50 KB
users.bson: ~100 KB
businesses.bson: ~1 KB
departments.bson: ~1 KB
```

**Total:** ~1.9 MB - Should import in < 1 minute

---

## 🎉 Success!

After import, your Atlas database will have all face embeddings ready for your mobile app to sync!

Test the sync from pagar_lens app:

```javascript
import OfflineSync from './src/services/offlineAttendanceSync';

const result = await OfflineSync.downloadEmbeddings();
console.log('Downloaded from Atlas:', result.downloaded); // Should be 101
```

---

**Need help?** Check MongoDB Atlas documentation: https://docs.atlas.mongodb.com/import/
