import pino from 'pino';

// Logger interface for easy library swapping
interface Logger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
  trace(message: string, meta?: any): void;
}

// Pino-specific implementation
class PinoLogger implements Logger {
  private logger: pino.Logger;

  constructor() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isServer = typeof window === 'undefined';
    
    // For client-side, use basic console logging
    if (!isServer) {
      this.logger = pino({
        level: isDevelopment ? 'debug' : 'info',
        browser: {
          asObject: true,
          write: {
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug,
            trace: console.trace,
          }
        }
      });
      return;
    }
    
    // For server-side
    this.logger = pino({
      level: isDevelopment ? 'debug' : 'info',
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      // Remove transport for Next.js compatibility
    });
  }

  error(message: string, meta?: any): void {
    this.logger.error(meta || {}, message);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(meta || {}, message);
  }

  info(message: string, meta?: any): void {
    this.logger.info(meta || {}, message);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(meta || {}, message);
  }

  trace(message: string, meta?: any): void {
    this.logger.trace(meta || {}, message);
  }
}

// Export singleton instance
export const logger: Logger = new PinoLogger();

// Convenience functions for common use cases
export const logRequest = (method: string, url: string, userId?: string, duration?: number) => {
  logger.info('API Request', {
    method,
    url,
    userId,
    duration,
    type: 'request'
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
    type: 'error'
  });
};

export const logUserAction = (action: string, userId: string, details?: any) => {
  logger.info('User Action', {
    action,
    userId,
    details,
    type: 'user_action'
  });
};

export const logBusinessEvent = (event: string, data?: any) => {
  logger.info('Business Event', {
    event,
    data,
    type: 'business_event'
  });
};

export const logPerformance = (operation: string, duration: number, details?: any) => {
  logger.info('Performance Metric', {
    operation,
    duration,
    details,
    type: 'performance'
  });
};

export const logApiResponse = (method: string, url: string, statusCode: number, duration: number, userId?: string, responseSize?: number) => {
  logger.info('API Response Complete', {
    method,
    url,
    statusCode,
    duration,
    userId,
    responseSize,
    type: 'api_response_complete'
  });
};