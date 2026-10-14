import { Controller, Get } from '@nestjs/common';
import { GalleryService } from './gallery.service';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  /**
   * GET /api/gallery
   * Galerie publique (médias publiés uniquement)
   */
  @Get()
  async getPublishedGallery() {
    return this.galleryService.getPublishedGallery();
  }

  /**
   * GET /api/gallery/media
   * Médias publiés depuis la table media_items (upload Cloudinary)
   */
  @Get('media')
  async getPublishedMedia() {
    return this.galleryService.getPublishedMedia();
  }
}