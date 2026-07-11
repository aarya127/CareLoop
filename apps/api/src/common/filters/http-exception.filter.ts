import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  requestId?: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      // HttpException messages are intentional and safe to surface to clients.
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const r = response as Record<string, unknown>;
        message = (r['message'] as string | string[]) ?? exception.message;
      }
    }
    // For non-HttpException errors (e.g. raw Prisma/DB errors) we deliberately do
    // NOT surface exception.message — it can leak schema/internal details. The
    // real error is logged server-side below; the client gets a generic message.

    const requestId =
      (request.headers?.['x-request-id'] as string | undefined) ??
      (request.id as string | undefined);

    // Don't log 401/403/404 as errors — they're expected
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}${requestId ? ` [${requestId}]` : ''}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorBody = {
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      ...(requestId ? { requestId } : {}),
      timestamp: new Date().toISOString(),
    };

    reply.status(status).send(body);
  }
}
