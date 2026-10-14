import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère toutes les actions publiées (pour le public)
   */
  async findAll() {
    return this.prisma.action.findMany({
      where: {
        publishedAt: { not: null },
      },
      orderBy: [{ date: 'desc' }],
    });
  }

  /**
   * Récupère une action par son ID
   */
  async findOne(id: string) {
    const action = await this.prisma.action.findUnique({
      where: { id },
    });

    if (!action) {
      throw new NotFoundException(`Action ${id} introuvable`);
    }

    return action;
  }

  /**
   * Récupère une action par son slug
   */
  async findBySlug(slug: string) {
    const action = await this.prisma.action.findUnique({
      where: { slug },
    });

    if (!action) {
      throw new NotFoundException(`Action ${slug} introuvable`);
    }

    return action;
  }
}