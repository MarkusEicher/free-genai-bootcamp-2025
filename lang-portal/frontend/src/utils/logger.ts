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
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

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

  private async flushQueue(isUnloading = false, retryCount = 0): Promise<void> {
    if (this.logQueue.length === 0 || this.isFlushingQueue) {
      return;
    }

    this.isFlushingQueue = true;
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      const keepaliveOptions = isUnloading ? { keepalive: true } : {};
      
      const response = await fetch(API_ENDPOINTS.LOGS.STORE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
        ...keepaliveOptions
      });

      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.status} ${response.statusText}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`Flushed ${logsToSend.length} logs to server`);
      }
    } catch (error) {
      // On error, add logs back to queue if not unloading and retry if possible
      if (!isUnloading) {
        this.logQueue = [...logsToSend, ...this.logQueue].slice(0, this.maxQueueSize);
        
        if (retryCount < this.maxRetries) {
          console.warn(`Failed to flush logs (attempt ${retryCount + 1}/${this.maxRetries}):`, error);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          
          // Retry with exponential backoff
          this.isFlushingQueue = false;
          return this.flushQueue(isUnloading, retryCount + 1);
        } else {
          console.error('Failed to flush logs after max retries:', error);
        }
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

    // Format error object for transmission
    if (entry.error instanceof Error) {
      entry.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack
      } as any;
    }

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