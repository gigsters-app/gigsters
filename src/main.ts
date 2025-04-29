import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'hbs';
import { RequestInfoInterceptor } from './common/interceptors/request-info.interceptor';
import { dump } from 'js-yaml';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // app.use((req, _, next) => {
  //   console.log('→ Incoming Origin:', req.headers.origin);
  //   next();
  // });
  // ✅ Enable CORS here
  app.enableCors({
    origin: ['https://gigsters-front-end-production.up.railway.app','http://localhost:5173','https://gigster-fontend-production.up.railway.app'],
    credentials: true,
  });

  // Apply the RequestInfoInterceptor globally
  app.useGlobalInterceptors(new RequestInfoInterceptor());

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
    // convert to YAML
    const yaml = dump(document, { noRefs: true });

    // serve the raw YAML at /docs.yaml
    app.getHttpAdapter().get('/docs.yaml', (req, res) => {
      res
        .type('application/x-yaml')
        .send(yaml);
    });
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


