import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') || 3000;
  const env = config.get<string>('app.env') || 'development';

  // Sécurité
  app.use(helmet());
  app.use(cookieParser(config.get<string>('cookies.secret')));

  // CORS — accepte toutes les origines en développement
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Préfixe API
  app.setGlobalPrefix('api', { exclude: ['health', ''] });

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 API démarrée sur http://localhost:${port}`);
  logger.log(`📦 Environnement : ${env}`);
  logger.log(`💚 Health check : http://localhost:${port}/health`);
}
bootstrap();