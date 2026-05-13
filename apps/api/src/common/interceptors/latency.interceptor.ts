import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/** Warn threshold in milliseconds — log any request slower than this. */
const SLOW_REQUEST_THRESHOLD_MS = 500;

/**
 * Logs request latency for every HTTP request.
 *
 * Fast requests (<500 ms) produce a DEBUG log.
 * Slow requests (>=500 ms) produce a WARN log so they are visible in production
 * without enabling verbose logging.
 *
 * The log line format is:
 *   [Latency] GET /api/analytics/overview → 200 in 123 ms
 *
 * Use these logs to identify endpoints that need query optimisation or caching.
 */
@Injectable()
export class LatencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Latency');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{
      method: string;
      url: string;
      routerPath?: string;
    }>();

    const method = req.method ?? '?';
    const path = req.routerPath ?? req.url ?? '?';
    const startMs = performance.now();

    return next.handle().pipe(
      tap({
        next: () => this.record(method, path, startMs, ctx),
        error: () => this.record(method, path, startMs, ctx),
      }),
    );
  }

  private record(
    method: string,
    path: string,
    startMs: number,
    ctx: ExecutionContext,
  ): void {
    const elapsed = Math.round(performance.now() - startMs);
    const status =
      ctx.switchToHttp().getResponse<{ statusCode?: number }>().statusCode ?? 0;
    const msg = `${method} ${path} → ${status} in ${elapsed} ms`;

    if (elapsed >= SLOW_REQUEST_THRESHOLD_MS) {
      this.logger.warn(`[SLOW] ${msg}`);
    } else {
      this.logger.debug(msg);
    }
  }
}
