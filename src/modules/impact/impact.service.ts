import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImpactService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    let stats = await this.prisma.impactStats.findFirst();

    if (!stats) {
      stats = await this.prisma.impactStats.create({
        data: {
          donors: 0,
          actionsCompleted: 0,
          peopleHelped: 0,
          localities: 0,
        },
      });
    }

    return stats;
  }
}