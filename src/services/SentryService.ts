import * as Sentry from '@sentry/node';
import { Express } from 'express';

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
  private isInitialized: boolean = false;
  private isEnabled: boolean = false;

  /**
   * Initialize Sentry with Express app
   */
  initialize(app: Express): void {
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
            const statusCode = (error as any).statusCode;
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
    } catch (error) {
      console.error('[Sentry] Failed to initialize:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Install Sentry error handler (must be after all routes)
   */
  installErrorHandler(app: Express): void {
    if (!this.isEnabled) return;

    app.use(Sentry.Handlers.errorHandler({
      shouldHandleError(error: any) {
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
  captureException(error: Error, context?: Record<string, any>): string | undefined {
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
  captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'): string | undefined {
    if (!this.isEnabled) {
      console.log(`[Sentry] Message (not sent - Sentry disabled): ${message}`);
      return undefined;
    }

    return Sentry.captureMessage(message, level);
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: {
    id?: string;
    email?: string;
    username?: string;
    role?: string;
    [key: string]: any;
  }): void {
    if (!this.isEnabled) return;

    Sentry.setUser(user);
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isEnabled) return;

    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb (trail of events leading to error)
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    data?: Record<string, any>;
  }): void {
    if (!this.isEnabled) return;

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
  setTag(key: string, value: string): void {
    if (!this.isEnabled) return;

    Sentry.setTag(key, value);
  }

  /**
   * Set multiple tags
   */
  setTags(tags: Record<string, string>): void {
    if (!this.isEnabled) return;

    Sentry.setTags(tags);
  }

  /**
   * Set context data
   */
  setContext(key: string, context: Record<string, any>): void {
    if (!this.isEnabled) return;

    Sentry.setContext(key, context);
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string): any {
    if (!this.isEnabled) return null;

    return Sentry.startTransaction({
      name,
      op,
    });
  }

  /**
   * Check if Sentry is enabled
   */
  isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * Flush pending events (useful for serverless)
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.isEnabled) return true;

    return Sentry.flush(timeout);
  }

  /**
   * Close Sentry client
   */
  async close(timeout: number = 2000): Promise<boolean> {
    if (!this.isEnabled) return true;

    return Sentry.close(timeout);
  }
}

// Export singleton instance
const sentryService = new SentryService();
export default sentryService;
