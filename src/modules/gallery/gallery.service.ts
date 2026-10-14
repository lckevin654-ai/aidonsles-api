import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Galerie publique classique (table gallery_items)
   */
  async getPublishedGallery() {
    const items = await this.prisma.galleryItem.findMany({
      orderBy: [{ order: 'asc' }, { date: 'desc' }],
    });

    return items.map((g) => ({
      id: g.id,
      type: g.type,
      category: g.category,
      title: g.title,
      location: g.location,
      date: g.date,
      url: g.url,
      actionId: g.actionId,
    }));
  }

  /**
   * Médias publiés (table media_items — upload Cloudinary)
   * Filtre : status = 'PUBLISHED' ET (publishedAt IS NULL OU publishedAt <= NOW())
   */
  async getPublishedMedia() {
    const now = new Date();

    const media = await this.prisma.mediaItem.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: now } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 100,
    });

    return media.map((m) => ({
      id: m.id,
      type: m.type,
      category: 'ceremonie',
      title: m.name,
      location: null,
      date: m.publishedAt || m.createdAt,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl || m.url,
      actionId: m.actionId,
      mimeType: m.mimeType,
      size: m.size,
      width: m.width,
      height: m.height,
    }));
  }
}