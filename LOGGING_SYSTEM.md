# Error Logging System

## Overview
The backend now includes a comprehensive logging system that stores error logs day by day and automatically deletes them after 3 days.

## Features

### 1. Daily Log Rotation
- Logs are organized by date with the pattern: `YYYY-MM-DD`
- Each day gets its own log file
- Old logs are compressed to save space

### 2. Automatic Deletion
- Logs are automatically deleted after **3 days**
- Configured with `maxFiles: '3d'` option
- Helps manage disk space automatically

### 3. Log Types

The system creates separate log files for different purposes:

#### Error Logs (`error-YYYY-MM-DD.log`)
- Contains only error-level logs
- Records critical errors and exceptions
- Location: `backend/logs/error-YYYY-MM-DD.log`

#### Combined Logs (`combined-YYYY-MM-DD.log`)
- Contains all log levels (info, warn, error)
- Comprehensive view of all application events
- Location: `backend/logs/combined-YYYY-MM-DD.log`

#### HTTP Request Logs (`http-YYYY-MM-DD.log`)
- Records all HTTP requests
- Includes method, URL, status code, duration, IP, user agent
- Logs different levels based on status codes:
  - 5xx errors → error level
  - 4xx errors → warning level
  - 2xx/3xx → info level
- Location: `backend/logs/http-YYYY-MM-DD.log`

#### Exception Logs (`exceptions-YYYY-MM-DD.log`)
- Captures uncaught exceptions
- Critical for debugging unexpected crashes
- Location: `backend/logs/exceptions-YYYY-MM-DD.log`

#### Rejection Logs (`rejections-YYYY-MM-DD.log`)
- Captures unhandled promise rejections
- Helps identify async errors
- Location: `backend/logs/rejections-YYYY-MM-DD.log`

## Configuration

### Log Format
All logs use JSON format with the following structure:
```json
{
  "timestamp": "YYYY-MM-DD HH:mm:ss",
  "level": "error|warn|info",
  "message": "Error message",
  "stack": "Stack trace (for errors)",
  ...additional context
}
```

### Rotation Settings
- **Date Pattern**: Daily (`YYYY-MM-DD`)
- **Max File Size**: 20MB per file
- **Retention**: 3 days
- **Compression**: Enabled (gzip)

### Environment Configuration
Set the log level in your `.env` file:
```
LOG_LEVEL=info  # Options: error, warn, info, debug
NODE_ENV=production  # Set to 'development' for console logging
```

## Usage

### Using the Logger in Code

```typescript
import logger from './utils/logger';

// Info level
logger.info('User logged in', { userId: '123', email: 'user@example.com' });

// Warning level
logger.warn('API rate limit approaching', { userId: '123', requests: 95 });

// Error level
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  database: 'MongoDB'
});
```

### HTTP Request Logging
Automatically logs all HTTP requests through the `requestLogger` middleware in `app.ts`.

### Error Handler Logging
The custom error handler automatically logs:
- Request details (method, URL, IP, user agent)
- User information (if authenticated)
- Request body, params, and query
- Error message and stack trace

## Log Storage

All logs are stored in: `backend/logs/`

This directory is excluded from Git via `.gitignore` to prevent committing sensitive log data.

## Development vs Production

### Development Mode
- Logs are output to both files and console
- Console logs are colored and formatted for readability

### Production Mode
- Logs are only written to files
- No console output to avoid performance impact

## Monitoring Logs

### View Recent Errors
```bash
# View today's error log
tail -f backend/logs/error-$(date +%Y-%m-%d).log

# View all errors from the last 3 days
cat backend/logs/error-*.log | jq .
```

### View HTTP Requests
```bash
# View today's HTTP requests
tail -f backend/logs/http-$(date +%Y-%m-%d).log

# Filter 5xx errors
cat backend/logs/http-*.log | jq 'select(.statusCode >= 500)'
```

### View Combined Logs
```bash
# View all logs from today
tail -f backend/logs/combined-$(date +%Y-%m-%d).log
```

## Benefits

1. **Organized**: Logs are separated by date and type
2. **Automatic Cleanup**: No manual deletion needed
3. **Space Efficient**: Old logs are compressed
4. **Searchable**: JSON format makes it easy to parse and search
5. **Complete Context**: Each error includes full request context
6. **Production Ready**: Minimal performance impact

## Troubleshooting

### Logs Directory Not Created
The logs directory is automatically created when the first log is written. If you want to create it manually:
```bash
mkdir -p backend/logs
```

### Logs Not Rotating
Ensure the application is running and receiving requests. Log rotation happens automatically based on the date pattern.

### Disk Space Issues
The system automatically deletes logs older than 3 days and compresses logs. If you need longer retention:
1. Edit `backend/src/utils/logger.ts`
2. Change `maxFiles: '3d'` to your desired retention (e.g., `'7d'` for 7 days)

## Implementation Files

- **Logger Configuration**: `backend/src/utils/logger.ts`
- **Request Logger Middleware**: `backend/src/middlewares/requestLogger.ts`
- **Error Handler**: `backend/src/errors/customErrorHandler.ts`
- **Application Integration**: `backend/src/app.ts`
