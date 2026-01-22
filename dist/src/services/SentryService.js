"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sentry = __importStar(require("@sentry/node"));
/**
 * Sentry Service for Error Tracking and Performance Monitoring
 *
 * Features:
 * - Automatic error tracking
 * - Performance monitoring
 * - Request context tracking
 * - User context tracking
 * - Custom tags and metadata
 * - Graceful degradation if Sentry DSN not provided
 */
class SentryService {
    constructor() {
        this.isInitialized = false;
        this.isEnabled = false;
    }
    /**
     * Initialize Sentry with Express app
     */
    initialize(app) {
        const sentryDsn = process.env.SENTRY_DSN;
        const environment = process.env.NODE_ENV || 'development';
        if (!sentryDsn) {
            console.log('[Sentry] No DSN provided - Error tracking disabled');
            this.isEnabled = false;
            return;
        }
        try {
            Sentry.init({
                dsn: sentryDsn,
                environment,
                // Performance Monitoring
                tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
                // Enable automatic instrumentation
                integrations: [
                    // Enable HTTP calls tracing
                    new Sentry.Integrations.Http({ tracing: true }),
                    // Enable Express integration
                    new Sentry.Integrations.Express({ app }),
                    // MongoDB queries tracking (if using mongoose)
                    ...(process.env.MONGO_HOST ? [new Sentry.Integrations.Mongo()] : []),
                ],
                // Set sample rate for errors
                sampleRate: 1.0, // Capture 100% of errors
                // Before sending an event
                beforeSend(event, hint) {
                    // Filter out certain errors if needed
                    const error = hint.originalException;
                    // Don't send validation errors to Sentry (too noisy)
                    if (error && typeof error === 'object' && 'statusCode' in error) {
                        const statusCode = error.statusCode;
                        if (statusCode === 400 || statusCode === 422) {
                            return null;
                        }
                    }
                    return event;
                },
                // Ignore certain errors
                ignoreErrors: [
                    'ValidationError',
                    'ValidationFailedError',
                    'AuthenticationFailedError',
                ],
            });
            // Request handler must be the first middleware
            app.use(Sentry.Handlers.requestHandler());
            // TracingHandler creates a trace for every incoming request
            app.use(Sentry.Handlers.tracingHandler());
            this.isInitialized = true;
            this.isEnabled = true;
            console.log(`[Sentry] Error tracking enabled for ${environment}`);
        }
        catch (error) {
            console.error('[Sentry] Failed to initialize:', error);
            this.isEnabled = false;
        }
    }
    /**
     * Install Sentry error handler (must be after all routes)
     */
    installErrorHandler(app) {
        if (!this.isEnabled)
            return;
        app.use(Sentry.Handlers.errorHandler({
            shouldHandleError(error) {
                // Capture all errors with status >= 500
                if (error.statusCode && typeof error.statusCode === 'number' && error.statusCode >= 500) {
                    return true;
                }
                // Also capture specific error types
                return true;
            },
        }));
    }
    /**
     * Manually capture an exception
     */
    captureException(error, context) {
        if (!this.isEnabled) {
            console.error('[Sentry] Exception (not sent - Sentry disabled):', error);
            return undefined;
        }
        return Sentry.captureException(error, {
            contexts: context ? { custom: context } : undefined,
        });
    }
    /**
     * Manually capture a message
     */
    captureMessage(message, level = 'info') {
        if (!this.isEnabled) {
            console.log(`[Sentry] Message (not sent - Sentry disabled): ${message}`);
            return undefined;
        }
        return Sentry.captureMessage(message, level);
    }
    /**
     * Set user context for error tracking
     */
    setUser(user) {
        if (!this.isEnabled)
            return;
        Sentry.setUser(user);
    }
    /**
     * Clear user context
     */
    clearUser() {
        if (!this.isEnabled)
            return;
        Sentry.setUser(null);
    }
    /**
     * Add breadcrumb (trail of events leading to error)
     */
    addBreadcrumb(breadcrumb) {
        if (!this.isEnabled)
            return;
        Sentry.addBreadcrumb({
            message: breadcrumb.message,
            category: breadcrumb.category || 'custom',
            level: breadcrumb.level || 'info',
            data: breadcrumb.data,
            timestamp: Date.now() / 1000,
        });
    }
    /**
     * Set tag for error context
     */
    setTag(key, value) {
        if (!this.isEnabled)
            return;
        Sentry.setTag(key, value);
    }
    /**
     * Set multiple tags
     */
    setTags(tags) {
        if (!this.isEnabled)
            return;
        Sentry.setTags(tags);
    }
    /**
     * Set context data
     */
    setContext(key, context) {
        if (!this.isEnabled)
            return;
        Sentry.setContext(key, context);
    }
    /**
     * Start a transaction for performance monitoring
     */
    startTransaction(name, op) {
        if (!this.isEnabled)
            return null;
        return Sentry.startTransaction({
            name,
            op,
        });
    }
    /**
     * Check if Sentry is enabled
     */
    isActive() {
        return this.isEnabled;
    }
    /**
     * Flush pending events (useful for serverless)
     */
    flush() {
        return __awaiter(this, arguments, void 0, function* (timeout = 2000) {
            if (!this.isEnabled)
                return true;
            return Sentry.flush(timeout);
        });
    }
    /**
     * Close Sentry client
     */
    close() {
        return __awaiter(this, arguments, void 0, function* (timeout = 2000) {
            if (!this.isEnabled)
                return true;
            return Sentry.close(timeout);
        });
    }
}
// Export singleton instance
const sentryService = new SentryService();
exports.default = sentryService;
