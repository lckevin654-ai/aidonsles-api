import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let databaseOk = false;
    let databaseError: string | null = null;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseOk = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : 'Unknown error';
    }

    return {
      status: databaseOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: databaseOk ? 'connected' : 'disconnected',
      ...(databaseError && { databaseError }),
    };
  }
}