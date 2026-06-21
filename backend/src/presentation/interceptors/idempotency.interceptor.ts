import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private processedKeys = new Set<string>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'] as string;

    if (idempotencyKey && this.processedKeys.has(idempotencyKey)) {
      this.logger.log(`Duplicate request detected: ${idempotencyKey}`);
      return of({ duplicate: true });
    }

    if (idempotencyKey) {
      this.processedKeys.add(idempotencyKey);
    }

    return next.handle();
  }
}

