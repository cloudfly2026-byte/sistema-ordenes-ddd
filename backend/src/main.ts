import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';
import { StructuredLogger } from './shared/logger/structured-logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(StructuredLogger);
  app.useLogger(logger);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shopify Order Processing API')
    .setDescription(
      'Sistema de gestión de empaque e inventario para Shopify. ' +
        'Procesa webhooks de órdenes, calcula materiales de empaque y gestiona inventario.',
    )
    .setVersion('1.0.0')
    .addTag('webhooks', 'Recepción de webhooks de Shopify')
    .addTag('orders', 'Gestión y consulta de órdenes')
    .addTag('inventory', 'Consulta y gestión de inventario')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  const error = err instanceof Error ? err : new Error(String(err));
  // eslint-disable-next-line no-console
  console.error('Failed to start application:', error.message, error.stack);
  process.exit(1);
});