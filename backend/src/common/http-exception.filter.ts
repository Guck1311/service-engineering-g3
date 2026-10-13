import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type {Request, Response} from 'express';
import {ApiErrorDto} from './api-error.dto.js';

/**
 * Global exception filter that returns every error in the same
 * {@link ApiErrorDto} format.
 *
 * `HttpException`s keep their status and message (validation errors give a
 * list of messages). Any other error is logged and returned as a generic 500,
 * so internal details never reach the client.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Converts an exception into a JSON error response.
   *
   * @param exception - The thrown error.
   * @param host - Gives access to the request and the response.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'Unexpected error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        error = exception.name;
      } else {
        const {message: msg, error: err} = body as Record<string, any>;
        message = msg ?? exception.message;
        error = err ?? exception.name;
      }
    } else {
      this.logger.error(exception);
    }

    const payload: ApiErrorDto = {
      statusCode,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(payload);
  }
}
