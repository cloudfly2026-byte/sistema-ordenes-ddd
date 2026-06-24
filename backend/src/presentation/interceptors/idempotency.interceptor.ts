import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Idempotency interceptor that prevents duplicate processing of webhooks.
 *
 * Strategy:
 * - Uses in-memory Set for same-process deduplication (fast path)
 * - The database UNIQUE constraint on webhook_events.shopify_event_id is the
 *   ultimate guard against duplicates across processes/instances
 *
 * This interceptor provides an early-exit optimization before the controller
 * logic runs, but the DB-level idempotency is the source of truth.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly processedKeys = new Set<string>();
  private readonly maxCacheSize = 10000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['x-shopify-event-id'] as string
      ?? request.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      // No idempotency key — let the request through
      return next.handle();
    }

    if (this.processedKeys.has(idempotencyKey)) {
      this.logger.log(`Duplicate request detected (memory cache): ${idempotencyKey}`);
      return of({ received: true, duplicate: true });
    }

    // Add to cache with size limit
    this.processedKeys.add(idempotencyKey);
    if (this.processedKeys.size > this.maxCacheSize) {
      // Clear oldest entries (Set maintains insertion order)
      const iterator = this.processedKeys.values();
      for (let i = 0; i < this.maxCacheSize / 2; i++) {
        const first = iterator.next().value;
        if (first) this.processedKeys.delete(first);
      }
    }

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`Request processed successfully: ${idempotencyKey}`);
      }),
      catchError((error) => {
        // On failure, remove from cache so the request can be retried
        this.processedKeys.delete(idempotencyKey);
        return throwError(() => error);
      }),
    );
  }
}
