import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module.js';
import {configureApp} from './setup.js';

/**
 * Starts the HTTP server on `PORT` (default 3000).
 *
 * The API is served under `/api/v1` and the Swagger UI under `/api/docs`.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
