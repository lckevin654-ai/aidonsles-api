import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Réseaux sociaux actifs (pour le site public)
   */
  async getSocialLinks() {
    const links = await this.prisma.socialLink.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
    });

    return links.map((l) => ({
      platform: l.platform,
      label: l.label,
      url: l.url,
      icon: l.icon,
    }));
  }

  /**
   * Méthodes de paiement disponibles (actives)
   */
  async getAvailablePaymentMethods() {
    const configs = await this.prisma.paymentConfig.findMany({
      where: { enabled: true },
      orderBy: { provider: 'asc' },
    });

    return configs.map((c) => ({
      provider: c.provider,
      label: c.label,
      mode: c.mode,
      publicKey: c.publicKey,
    }));
  }

  /**
   * Statut global des paiements (pour afficher "Bientôt disponible")
   */
  async getPaymentStatus() {
    const enabledCount = await this.prisma.paymentConfig.count({
      where: { enabled: true },
    });

    return {
      available: enabledCount > 0,
      enabledCount,
      message: enabledCount > 0
        ? 'Paiements disponibles'
        : 'Paiements bientôt disponibles',
    };
  }
}