# Production Deployment Guide

**Last Updated:** January 21, 2026
**Version:** Phase 5 Complete

---

## Quick Start

### 1. Prerequisites

- Node.js v20.x or higher
- MongoDB v7.x or higher
- PM2 (recommended for production)
- nginx or Apache (for reverse proxy)

### 2. Install Dependencies

```bash
cd backend
npm install --legacy-peer-deps
```

### 3. Configure Environment

Create `.env` file:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/hrms

# Authentication
JWT_SECRET=your-256-bit-random-secret-here
JWT_EXPIRE=24h

# Optional - Testing
MONGODB_TEST_URI=mongodb://localhost:27017/hrms-test
```

**Generate Strong JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Build Application

```bash
npm run build
```

Expected output: `Compiled successfully`

### 5. Run Database Migrations/Seeds (if needed)

```bash
# Seed initial data (optional)
npm run seed
```

### 6. Start Production Server

**Option A: Direct Node**
```bash
npm start
```

**Option B: PM2 (Recommended)**
```bash
pm2 start dist/src/server.js --name hrms-api
pm2 save
pm2 startup
```

### 7. Verify Deployment

```bash
# Health check
curl http://localhost:3000/health

# Expected: {"status":"ok","timestamp":"..."}
```

---

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/hrms` |
| `JWT_SECRET` | JWT signing secret | `64-char hex string` |
| `JWT_EXPIRE` | JWT expiry time | `24h` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_TEST_URI` | Test database | `mongodb://localhost:27017/hrms-test` |
| `LOG_LEVEL` | Logging level | `info` |

---

## Database Setup

### Create Indexes Manually (Production)

For production, create indexes manually to avoid blocking:

```javascript
// Connect to MongoDB
mongosh

// Switch to database
use hrms

// Attendance indexes
db.attendances.createIndex(
  { "checkInLocation.mocked": 1 },
  { background: true }
)
db.attendances.createIndex(
  { "checkOutLocation.mocked": 1 },
  { background: true }
)
db.attendances.createIndex(
  { date: 1, checkInTime: 1 },
  { background: true }
)
db.attendances.createIndex(
  { flagged: 1, flagStatus: 1, flaggedAt: -1 },
  { background: true }
)

// Activity indexes
db.activities.createIndex(
  { staff: 1, status: 1, startTime: -1 },
  { background: true }
)
db.activities.createIndex(
  { staff: 1, startTime: -1 },
  { background: true }
)
db.activities.createIndex(
  { business: 1, startTime: -1 },
  { background: true }
)
db.activities.createIndex(
  { business: 1, department: 1 },
  { background: true }
)
db.activities.createIndex(
  { type: 1, status: 1 },
  { background: true }
)

// Verify indexes
db.attendances.getIndexes()
db.activities.getIndexes()
db.alerts.getIndexes()
```

---

## Reverse Proxy Configuration

### nginx Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API Proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for large file uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Rate limiting (additional layer)
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

---

## Security Hardening

### Application Level (Already Implemented ✅)

- ✅ Rate limiting on all endpoints
- ✅ Input validation comprehensive
- ✅ Sensitive data masking
- ✅ GPS spoofing detection
- ✅ Helmet.js security headers

### Server Level (Manual Configuration)

**1. Firewall Rules**
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 27017 # MongoDB (from localhost only)
ufw enable
```

**2. MongoDB Security**
```javascript
// Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "strong-password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

// Create app user
use hrms
db.createUser({
  user: "hrmsapp",
  pwd: "strong-password",
  roles: [ { role: "readWrite", db: "hrms" } ]
})

// Enable authentication
// Edit /etc/mongod.conf:
security:
  authorization: enabled
```

**3. SSL/TLS Configuration**
```bash
# Let's Encrypt (recommended)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Monitoring & Logging

### Application Logs

**Location:** `logs/` directory

```bash
# View logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# View PM2 logs
pm2 logs hrms-api
```

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time | < 200ms | > 1s |
| Report Generation | < 2s | > 5s |
| Memory Usage | < 500MB | > 1GB |
| CPU Usage | < 50% | > 80% |
| Database Connections | < 50 | > 100 |
| Error Rate | < 0.1% | > 1% |
| Rate Limit Hits | Low | High |

### Monitoring Tools (Recommended)

- **PM2 Plus:** Application monitoring
- **MongoDB Atlas:** Database monitoring
- **New Relic / DataDog:** APM
- **Sentry:** Error tracking
- **Grafana + Prometheus:** Custom metrics

---

## Backup Strategy

### Database Backups

**Daily Backup Script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"

mongodump --uri="mongodb://localhost:27017/hrms" \
          --out="$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

**Cron Schedule:**
```bash
# Daily at 2 AM
0 2 * * * /path/to/backup-script.sh
```

### File Uploads Backup

```bash
# Backup uploaded files
rsync -avz /path/to/uploads/ /backup/location/
```

---

## Performance Optimization

### Application Level (Already Implemented ✅)

- ✅ MongoDB aggregation pipelines (no N+1 queries)
- ✅ .lean() optimization for read-only queries
- ✅ Database indexes optimized
- ✅ Field selection in populate()

### Server Level (Manual Configuration)

**1. Node.js Cluster Mode**
```javascript
// Use PM2 cluster mode
pm2 start dist/src/server.js -i max --name hrms-api
```

**2. MongoDB Configuration**
```yaml
# /etc/mongod.conf
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2

net:
  maxIncomingConnections: 200
```

**3. Enable Compression**
```javascript
// In app.ts (already likely configured)
app.use(compression());
```

---

## Troubleshooting

### Application Won't Start

**Check:**
1. MongoDB is running: `sudo systemctl status mongod`
2. Environment variables set: `cat .env`
3. Build successful: `npm run build`
4. Port not in use: `lsof -i :3000`

**Fix:**
```bash
# Restart MongoDB
sudo systemctl restart mongod

# Kill process on port
kill -9 $(lsof -t -i:3000)

# Rebuild
npm run build
```

### High Memory Usage

**Check PM2 Status:**
```bash
pm2 status
pm2 monit
```

**Restart Application:**
```bash
pm2 restart hrms-api
```

### Slow Queries

**Check MongoDB Logs:**
```bash
# View slow queries (> 100ms)
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

**Verify Indexes:**
```bash
db.attendances.getIndexes()
db.activities.getIndexes()
```

### Rate Limiting Issues

**Check Rate Limit Headers:**
```bash
curl -I http://localhost:3000/api/some-endpoint
```

**Adjust Limits (if needed):**
Edit `src/middlewares/rateLimiter.ts` and rebuild.

---

## Rollback Procedure

### If Deployment Fails

**1. Stop New Version**
```bash
pm2 stop hrms-api
```

**2. Restore Previous Version**
```bash
git checkout <previous-tag>
npm install --legacy-peer-deps
npm run build
pm2 restart hrms-api
```

**3. Restore Database (if needed)**
```bash
mongorestore --uri="mongodb://localhost:27017/hrms" \
             --drop /backups/mongodb/backup_<timestamp>
```

---

## Health Checks

### Automated Health Check Script

```bash
#!/bin/bash

HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s $HEALTH_URL)

if [[ $RESPONSE == *'"status":"ok"'* ]]; then
    echo "✅ API is healthy"
    exit 0
else
    echo "❌ API is unhealthy"
    # Send alert
    # curl -X POST webhook-url -d "API health check failed"
    exit 1
fi
```

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

---

## Production Checklist

### Pre-Deployment

- [ ] All tests passing: `npm test`
- [ ] Build successful: `npm run build`
- [ ] Environment variables configured
- [ ] Strong JWT secret generated
- [ ] Database backups configured
- [ ] SSL certificate installed
- [ ] Firewall rules configured
- [ ] MongoDB authentication enabled

### Post-Deployment

- [ ] Health check passes
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] File uploads working
- [ ] PDF exports generating
- [ ] Logs being written
- [ ] Monitoring configured
- [ ] Backup script tested

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor error logs
- Check API response times
- Verify backups completed

**Weekly:**
- Review slow query logs
- Check disk space
- Update dependencies (security patches)

**Monthly:**
- Performance review
- Security audit
- Database optimization

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update non-breaking
npm update

# Update all (test first!)
npm update --legacy-peer-deps
npm test
npm run build
```

---

## Contact & Resources

**Documentation:**
- Phase 5 Complete: `PHASE5_COMPLETE.md`
- Security: `PHASE5_SECURITY_HARDENING_COMPLETE.md`
- Testing: `PHASE5_TESTING_FOUNDATION_COMPLETE.md`

**Quick Commands:**
```bash
npm start           # Start production
npm test            # Run tests
npm run build       # Build TypeScript
pm2 status          # Check PM2 status
pm2 logs hrms-api   # View logs
pm2 restart hrms-api # Restart app
```

---

**Last Updated:** January 21, 2026
**Status:** Production Ready ✅
