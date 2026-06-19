import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  const config = new DocumentBuilder()
    .setTitle('Mangaka API')
    .setDescription('The mangaka API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  // 2. Định nghĩa các URL CDN cho asset của Swagger
  // Chọn phiên bản (CDN_VERSION) khớp hoặc gần nhất với bản swagger-ui-express bạn dùng
  const CDN_VERSION = '4.15.5';
  const customOptions = {
    customCssUrl: [
      `https://cloudflare.com${CDN_VERSION}/swagger-ui.min.css`,
      `https://cloudflare.com${CDN_VERSION}/swagger-ui-standalone-preset.min.css`,
    ],
    customJs: [
      `https://cloudflare.com${CDN_VERSION}/swagger-ui-bundle.min.js`,
      `https://cloudflare.com${CDN_VERSION}/swagger-ui-standalone-preset.min.js`,
    ],
  };
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, customOptions);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
