import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { ActionsModule } from './modules/actions/actions.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ImpactModule } from './modules/impact/impact.module';
import { NextActionModule } from './modules/next-action/next-action.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { NewsModule } from './modules/news/news.module';
import { DonationsModule } from './modules/donations/donations.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { PublicModule } from './modules/public/public.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env'],
    }),

    PrismaModule,
    HealthModule,
    ActionsModule,
    UsersModule,
    AuthModule,
    ImpactModule,
    NextActionModule,
    GalleryModule,
    NewsModule,
    DonationsModule,
    AdminAuthModule,
    AdminModule,
    CloudinaryModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}