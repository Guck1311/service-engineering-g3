import {applyDecorators} from '@nestjs/common';
import {ApiProperty, ApiResponse} from '@nestjs/swagger';

/** Body of every error response, produced by `HttpExceptionFilter`. */
export class ApiErrorDto {
  /** HTTP status code, repeated in the body. */
  @ApiProperty({example: 404})
  statusCode: number;

  /** Short name of the error, e.g. `Bad Request`. */
  @ApiProperty({example: 'Not Found'})
  error: string;

  /** Human-readable description; a list of messages for validation errors. */
  @ApiProperty({
    oneOf: [{type: 'string'}, {type: 'array', items: {type: 'string'}}],
    example: 'Music item 42 not found',
  })
  message: string | string[];

  /** Requested URL. */
  @ApiProperty({example: '/api/v1/music-items/42'})
  path: string;

  /** Time of the error as an ISO 8601 string. */
  @ApiProperty({example: '2026-11-09T08:00:00.000Z'})
  timestamp: string;
}

/** Swagger descriptions of the error status codes used by the API. */
const descriptions: Record<number, string> = {
  400: 'Validation failed',
  401: 'Missing or unknown X-User-Id',
  403: 'Caller lacks the required role or does not own the resource',
  404: 'Resource not found',
  409: 'Resource already exists',
};

/**
 * Documents the given error status codes in Swagger, all with the shared
 * {@link ApiErrorDto} schema.
 *
 * @param statuses - HTTP status codes the endpoint can return, e.g. `400, 404`.
 *
 * @example
 * ```ts
 * @Get(':id')
 * @ApiErrors(404)
 * findOne(...) { ... }
 * ```
 */
export const ApiErrors = (...statuses: number[]) =>
  applyDecorators(
    ...statuses.map(status =>
      ApiResponse({
        status,
        description: descriptions[status],
        type: ApiErrorDto,
      }),
    ),
  );
