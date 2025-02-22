export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
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
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async flushQueue(immediate = false): Promise<void> {
    if (this.isFlushingQueue || this.logQueue.length === 0) return;

    this.isFlushingQueue = true;
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      if (immediate) {
        // Use synchronous fetch for immediate flush
        await fetch('/api/v1/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: logsToSend }),
        });
      } else {
        // Normal async flush - use direct path to avoid double prefix
        await fetch('/api/v1/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: logsToSend })
        });
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // On error, add logs back to queue if space allows
      const totalSize = this.logQueue.length + logsToSend.length;
      if (totalSize <= this.maxQueueSize) {
        this.logQueue = [...logsToSend, ...this.logQueue];
      }
    } finally {
      this.isFlushingQueue = false;
    }
  }

  private addToQueue(entry: LogEntry): void {
    // Add timestamp if not present
    if (!entry.timestamp) {
      entry.timestamp = new Date().toISOString();
    }

    // Log to console
    const consoleMsg = `[${entry.component}] ${entry.message}`;
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(consoleMsg, entry.details || '');
        break;
      case LogLevel.INFO:
        console.info(consoleMsg, entry.details || '');
        break;
      case LogLevel.WARN:
        console.warn(consoleMsg, entry.details || '');
        break;
      case LogLevel.ERROR:
        console.error(consoleMsg, entry.error || entry.details || '');
        break;
    }

    // Add to queue
    this.logQueue.push(entry);

    // Flush if queue is full
    if (this.logQueue.length >= this.maxQueueSize) {
      this.flushQueue();
    }
  }

  public debug(component: string, message: string, details?: Record<string, unknown>): void {
    this.addToQueue({ level: LogLevel.DEBUG, component, message, details, timestamp: new Date().toISOString() });
  }

  public info(component: string, message: string, details?: Record<string, unknown>): void {
    this.addToQueue({ level: LogLevel.INFO, component, message, details, timestamp: new Date().toISOString() });
  }

  public warn(component: string, message: string, details?: Record<string, unknown>): void {
    this.addToQueue({ level: LogLevel.WARN, component, message, details, timestamp: new Date().toISOString() });
  }

  public error(component: string, message: string, error?: Error, details?: Record<string, unknown>): void {
    this.addToQueue({
      level: LogLevel.ERROR,
      component,
      message,
      error,
      details,
      timestamp: new Date().toISOString()
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

export const logger = Logger.getInstance();