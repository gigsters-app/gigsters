import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'hbs';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ Enable CORS here
  app.enableCors({
    origin: ['https://gigsters-front-end-production.up.railway.app'],
    credentials: true,
  });

  setupSwagger(app);
  setupGlobalPipes(app);
   // Serve static assets from the "public" folder
   app.setViewEngine('hbs');
   app.setBaseViewsDir(join(__dirname, '..', 'views'));
   hbs.registerPartials(join(__dirname, '..', 'views', 'partials')); // optional, for layouts
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
