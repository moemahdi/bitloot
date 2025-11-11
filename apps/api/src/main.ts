import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded, type Request, type Response, type NextFunction } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  // Standard JSON and URL-encoded parsing
  // IMPORTANT: Must happen BEFORE the rawBody middleware so req.body is populated
  app.use(json());
  app.use(urlencoded({ extended: true }));

  // Custom middleware to capture raw body AFTER json parsing for webhook verification
  // We reconstruct the raw body from the parsed object for HMAC verification
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.method === 'POST' && typeof req.body === 'object' && req.body !== null) {
      // Reconstruct raw body string from parsed JSON for HMAC verification
      // This is safe because we know it's valid JSON that was just parsed
      (req as unknown as Record<string, unknown>).rawBody = JSON.stringify(req.body);
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('BitLoot API')
    .setDescription('Crypto-only e-commerce for instant delivery of digital goods')
    .setVersion('0.0.1')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port);
  logger.log(`✅ API running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
