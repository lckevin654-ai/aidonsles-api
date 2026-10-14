import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.news.findMany({
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const item = await this.prisma.news.findUnique({
      where: { slug },
    });

    if (!item) {
      throw new NotFoundException('Actualité introuvable');
    }

    return item;
  }
}