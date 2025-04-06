import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS here
  app.enableCors({
    origin: ['http://localhost:4200', 'https://yourdomain.com'],
    credentials: true,
  });

  setupSwagger(app);
  setupGlobalPipes(app);
  
  const port = process.env.PORT ?? 3000;

  await app.listen(port);
  console.log(`🚀 Application is running on http://localhost:${port}`);
}

function setupSwagger(app) {
  const config = new DocumentBuilder()
    .setTitle('Gigsters')
    .setDescription('The Gigsters API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token', // <-- custom name to reference later
    )
    .addTag('gigsters')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}

function setupGlobalPipes(app) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

bootstrap();
