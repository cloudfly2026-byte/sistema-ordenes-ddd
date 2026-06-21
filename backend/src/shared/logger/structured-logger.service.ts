import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

export interface LogContext {
  traceId?: string;
  orderId?: string;
  jobId?: string;
  userId?: string;
  [key: string]: string | undefined;
}

@Injectable()
export class StructuredLogger implements LoggerService {
  private context?: string;

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string): void {
    this.print('log', message, context);
  }

  warn(message: string, context?: string): void {
    this.print('warn', message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.print('error', message, context, trace);
  }

  debug(message: string, context?: string): void {
    this.print('debug', message, context);
  }

  verbose(message: string, context?: string): void {
    this.print('verbose', message, context);
  }

  private print(
    level: LogLevel,
    message: string,
    context?: string,
    trace?: string,
  ): void {
    const ctx = context ?? this.context ?? 'Application';
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: ctx,
      message,
    };

    switch (level) {
      case 'error':
        // eslint-disable-next-line no-console
        console.error(JSON.stringify({ ...entry, trace }));
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(JSON.stringify(entry));
        break;
      case 'debug':
      case 'verbose':
        // eslint-disable-next-line no-console
        console.debug(JSON.stringify(entry));
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(entry));
    }
  }
}