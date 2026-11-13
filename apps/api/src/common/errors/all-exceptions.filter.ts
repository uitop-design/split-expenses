import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { buildErrorBody } from './error-body.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const body = buildErrorBody(exception, request.originalUrl);
    if (!(exception instanceof HttpException) && body.statusCode >= 500) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    http.getResponse<Response>().status(body.statusCode).json(body);
  }
}
