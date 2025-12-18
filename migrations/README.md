# Database Migrations

This directory contains database migration scripts for the Punchora backend.

## Running Migrations

### Option 1: Using MongoDB Shell

```bash
# Connect to your MongoDB instance
mongo "mongodb+srv://vishnuab1207:cfGPGTfxu8LVkbU6@cluster0.xgensfz.mongodb.net/s_hrms"

# Run the migration
load("001_attendance_enhancements.js")
```

### Option 2: Using mongosh (modern MongoDB Shell)

```bash
# Connect and run
mongosh "mongodb+srv://vishnuab1207:cfGPGTfxu8LVkbU6@cluster0.xgensfz.mongodb.net/s_hrms" --file 001_attendance_enhancements.js
```

### Option 3: Using Node.js Script

```bash
# From backend directory
node migrations/run-migration.js 001_attendance_enhancements
```

## Available Migrations

### 001_attendance_enhancements.js

**Purpose:** Enhance attendance tracking with idempotency and location flagging

**Changes:**
- Adds `flagged: false` default to existing records
- Creates index on `{ staff: 1, date: 1 }` for faster queries
- Creates unique sparse index on `idempotencyKey` for duplicate prevention
- Creates index on `flagged` for admin queries

**Safe to run:** Yes (idempotent - can be run multiple times)

**Rollback:** Not needed (only adds indexes and default values)

## Migration Best Practices

1. **Backup first:** Always backup your database before running migrations
2. **Test in staging:** Run migrations in staging environment first
3. **Check logs:** Review migration output for any errors
4. **Verify:** Check that indexes were created successfully

## Troubleshooting

### Index already exists error
This is normal if migration has been run before. The script handles this gracefully.

### Connection timeout
Check your MongoDB connection string and network connectivity.

### Duplicate key error on idempotencyKey
This means you have duplicate idempotency keys in your database. Clean them up manually first.
