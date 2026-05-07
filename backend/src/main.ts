import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Global API Prefix (exclude root health/info endpoints)
  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'health'],
  });

  // 2. Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Team Task Manager API')
    .setDescription('Production-ready task management API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 3. Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // 4. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Useful for Pagination/Filter DTOs
      },
    }),
  );

  // 5. CORS Configuration
  const nodeEnv = configService.get<string>('NODE_ENV');
  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? configService.get<string>('CORS_ORIGIN') || '*'
        : true,
    credentials: true,
  });

  // 6. Graceful Shutdown
  app.enableShutdownHooks();

  // 7. Start Server
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  const url = await app.getUrl();
  logger.log(`🚀 Application is running on: ${url}/api/v1`);
  logger.log(`📚 Swagger documentation available at: ${url}/api/docs`);
}

void bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
