import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NextActionService {
  constructor(private readonly prisma: PrismaService) {}

  async getNext() {
    const next = await this.prisma.nextAction.findFirst({
      where: { active: true },
      orderBy: { date: 'asc' },
    });

    if (!next) {
      throw new NotFoundException('Aucune prochaine action planifiée');
    }

    return next;
  }
}