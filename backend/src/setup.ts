import {INestApplication, ValidationPipe} from '@nestjs/common';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {USER_ID_HEADER} from './common/auth.guard.js';
import {HttpExceptionFilter} from './common/http-exception.filter.js';

/**
 * Applies the global HTTP configuration to a Nest application.
 *
 * - Prefixes all routes with `/api/v1` and enables CORS for the frontend.
 * - Validates and transforms request DTOs and rejects unknown properties.
 * - Formats all errors with {@link HttpExceptionFilter}.
 * - Generates the OpenAPI document and serves the Swagger UI at `/api/docs`.
 *
 * Shared by `main.ts` and the e2e tests so both run the same configuration.
 *
 * @param app - The application to configure, before it starts listening.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Music Collection Manager API')
    .setDescription(
      'KV Service Engineering WS 2026/2027, group 3. ' +
        'Send the X-User-Id header with a seeded user id (1 = Admin, 2 = Anna, 3 = Ben).',
    )
    .setVersion('1.0')
    .addApiKey({type: 'apiKey', in: 'header', name: USER_ID_HEADER}, 'user-id')
    .addSecurityRequirements('user-id')
    .build();
  SwaggerModule.setup('api/docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
