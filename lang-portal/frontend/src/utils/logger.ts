import { API_ENDPOINTS } from '../api/constants';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component: string;
  message: string;
  details?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private readonly maxQueueSize = 100;
  private logQueue: LogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private isFlushingQueue = false;

  private constructor() {
    // Start periodic flush
    setInterval(() => this.flushQueue(), this.flushInterval);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushQueue(true);
    });

    // Log initialization
    this.info('Logger', 'Frontend logger initialized');
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async flushQueue(isUnloading = false): Promise<void> {
    if (this.logQueue.length === 0 || this.isFlushingQueue) {
      return;
    }

    this.isFlushingQueue = true;
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      const keepaliveOptions = isUnloading ? { keepalive: true } : {};
      
      await fetch(API_ENDPOINTS.LOGS.STORE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
        ...keepaliveOptions
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`Flushed ${logsToSend.length} logs to server`);
      }
    } catch (error) {
      // On error, add logs back to queue if not unloading
      if (!isUnloading) {
        this.logQueue = [...logsToSend, ...this.logQueue].slice(0, this.maxQueueSize);
        console.error('Failed to flush logs:', error);
      }
    } finally {
      this.isFlushingQueue = false;
    }
  }

  private addToQueue(entry: LogEntry): void {
    this.logQueue.push(entry);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const { level, component, message, details, error } = entry;
      const consoleMethod = level.toLowerCase() as keyof Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;
      console[consoleMethod](`[${component}] ${message}`, details || '', error || '');
    }

    if (this.logQueue.length >= this.maxQueueSize) {
      this.flushQueue();
    }
  }

  public debug(component: string, message: string, details?: Record<string, unknown>): void {
    this.addToQueue({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      component,
      message,
      details
    });
  }

  public info(component: string, message: string, details?: Record<string, unknown>): void {
    this.addToQueue({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      component,
      message,
      details
    });
  }

  public warn(component: string, message: string, details?: Record<string, unknown>): void {
    this.addToQueue({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      component,
      message,
      details
    });
  }

  public error(component: string, message: string, error?: Error, details?: Record<string, unknown>): void {
    this.addToQueue({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component,
      message,
      error,
      details
    });
  }

  public logApiRequest(
    method: string,
    url: string,
    duration: number,
    status: number,
    success: boolean,
    details?: Record<string, unknown>
  ): void {
    this.info('API', `${method} ${url}`, {
      duration,
      status,
      success,
      ...details
    });
  }

  public logCacheOperation(
    operation: string,
    key: string,
    success: boolean,
    details?: Record<string, unknown>
  ): void {
    this.debug('Cache', `${operation} - ${key}`, {
      success,
      ...details
    });
  }

  public logRetryAttempt(
    component: string,
    attempt: number,
    maxAttempts: number,
    delay: number,
    error?: Error
  ): void {
    this.warn(component, `Retry attempt ${attempt}/${maxAttempts}`, {
      delay,
      error: error?.message
    });
  }
}

export { Logger, type LogEntry };

// Export singleton instance
export const logger = Logger.getInstance();