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

  // CORS — autorise les origines locales + Netlify + Vercel
  const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://aidonsles-web.netlify.app',
    /\.netlify\.app$/,
    /\.vercel\.app$/,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (Postman, curl, etc.)
      if (!origin) return callback(null, true);

      // Vérifier si l'origin est autorisée
      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Origin non autorisée : ${origin}`);
        callback(new Error('Non autorisé par CORS'), false);
      }
    },
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