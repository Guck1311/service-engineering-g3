import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Gemeinsamer Pfad für alle REST-Endpunkte
  app.setGlobalPrefix('api/v1');

  // OpenAPI konfigurieren
  const config = new DocumentBuilder()
    .setTitle('Music Collection Manager')
    .setDescription('Service Engineering – Exercise 1')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-User-Id',
      },
      'user-id',
    )
    .addSecurityRequirements('user-id')
    .build();

  // API-Dokumentation erzeugen
  const document = SwaggerModule.createDocument(app, config);

  // Swagger-Oberfläche bereitstellen
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();