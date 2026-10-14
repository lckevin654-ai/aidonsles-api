import { Controller, Get } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  /**
   * GET /api/public/social-links
   * Réseaux sociaux actifs (public, sans auth)
   */
  @Get('social-links')
  async getSocialLinks() {
    return this.publicService.getSocialLinks();
  }

  /**
   * GET /api/public/payment-methods
   * Méthodes de paiement disponibles
   */
  @Get('payment-methods')
  async getPaymentMethods() {
    return this.publicService.getAvailablePaymentMethods();
  }

  /**
   * GET /api/public/payment-status
   * Statut global des paiements
   */
  @Get('payment-status')
  async getPaymentStatus() {
    return this.publicService.getPaymentStatus();
  }
}