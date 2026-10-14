import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DonationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère tous les dons d'un utilisateur
   */
  async findByUser(userId: string) {
    return this.prisma.donation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        action: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            city: true,
          },
        },
      },
    });
  }

  /**
   * Récupère les statistiques d'un utilisateur
   */
  async getStats(userId: string) {
    const donations = await this.prisma.donation.findMany({
      where: { userId, status: 'CONFIRMED' },
    });

    const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const count = donations.length;
    const impact = Math.round(total / 5000);
    const lastDonation = donations[0] || null;

    return {
      total,
      count,
      impact,
      lastDonation,
      currency: donations[0]?.currency || 'XAF',
    };
  }

  /**
   * Récupère un don par ID
   */
  async findOne(id: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: { action: true },
    });

    if (!donation) {
      throw new NotFoundException('Don introuvable');
    }

    return donation;
  }
    /**
   * Génère un reçu HTML pour un don
   */
  async getReceipt(donationId: string, userId: string) {
    const donation = await this.prisma.donation.findFirst({
      where: {
        id: donationId,
        userId,
      },
      include: {
        action: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
          },
        },
      },
    });

    if (!donation) {
      throw new NotFoundException('Don introuvable');
    }

    if (donation.status !== 'CONFIRMED') {
      throw new NotFoundException('Seuls les dons confirmés ont un reçu');
    }

    return donation;
  }

  /**
   * Génère le HTML du reçu
   */
  generateReceiptHTML(donation: any): string {
    const amount = Number(donation.amount).toLocaleString('fr-FR');
    const date = new Date(donation.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Reçu ${donation.reference}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #f5f7fa;
    color: #0f172a;
    padding: 40px 20px;
    line-height: 1.6;
  }
  .container {
    max-width: 700px;
    margin: 0 auto;
    background: #fff;
    border-radius: 16px;
    padding: 50px;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 30px;
    border-bottom: 3px solid #0F3D3A;
    margin-bottom: 30px;
  }
  .logo {
    font-size: 1.8rem;
    font-weight: 800;
    color: #0F3D3A;
    font-family: Georgia, serif;
  }
  .logo span { color: #E8890C; }
  .receipt-number {
    text-align: right;
    font-size: 0.85rem;
    color: #64748b;
  }
  .receipt-number strong {
    display: block;
    font-size: 1.1rem;
    color: #0F3D3A;
    margin-top: 4px;
    font-family: monospace;
  }
  h1 {
    font-size: 1.6rem;
    color: #0F3D3A;
    margin-bottom: 8px;
    font-family: Georgia, serif;
  }
  .subtitle {
    color: #64748b;
    font-size: 0.95rem;
    margin-bottom: 30px;
  }
  .amount-box {
    background: linear-gradient(135deg, #E6F5EE, #D1FAE5);
    border: 2px solid #2E9B63;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    margin-bottom: 30px;
  }
  .amount-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #2E9B63;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .amount-value {
    font-size: 2.2rem;
    font-weight: 800;
    color: #0F3D3A;
    font-family: Georgia, serif;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }
  .info-item {
    padding: 14px;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 3px solid #0F3D3A;
  }
  .info-item .label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .info-item .value {
    font-size: 0.95rem;
    color: #0f172a;
    font-weight: 600;
    word-break: break-word;
  }
  .status-badge {
    display: inline-block;
    padding: 6px 16px;
    background: #D1FAE5;
    color: #065F46;
    border-radius: 50px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .footer {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 0.85rem;
    color: #64748b;
  }
  .footer strong { color: #0F3D3A; }
  .action-buttons {
    margin-top: 30px;
    text-align: center;
  }
  .btn {
    display: inline-block;
    padding: 12px 28px;
    background: #E8890C;
    color: #fff;
    text-decoration: none;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    margin: 0 6px;
    border: none;
    cursor: pointer;
    transition: 0.2s;
  }
  .btn:hover { background: #B86A00; }
  .btn-secondary {
    background: transparent;
    border: 2px solid #0F3D3A;
    color: #0F3D3A;
  }
  .btn-secondary:hover { background: #0F3D3A; color: #fff; }
  @media print {
    body { background: #fff; padding: 0; }
    .container { box-shadow: none; padding: 20px; }
    .action-buttons { display: none; }
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">AIDONS <span>LES</span></div>
      <div class="receipt-number">
        Reçu N°
        <strong>${donation.reference}</strong>
      </div>
    </div>

    <h1>Reçu de don</h1>
    <p class="subtitle">Ce document atteste de votre don à AIDONS LES.</p>

    <div class="amount-box">
      <div class="amount-label">Montant du don</div>
      <div class="amount-value">${amount} ${donation.currency}</div>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <div class="label">Donateur</div>
        <div class="value">${donation.donorFirstName || ''} ${donation.donorLastName || ''}</div>
      </div>
      <div class="info-item">
        <div class="label">Email</div>
        <div class="value">${donation.donorEmail || '—'}</div>
      </div>
      <div class="info-item">
        <div class="label">Date</div>
        <div class="value">${date}</div>
      </div>
      <div class="info-item">
        <div class="label">Méthode</div>
        <div class="value">${donation.method}</div>
      </div>
      <div class="info-item">
        <div class="label">Action soutenue</div>
        <div class="value">${donation.action ? donation.action.title : 'Action générale'}</div>
      </div>
      <div class="info-item">
        <div class="label">Statut</div>
        <div class="value"><span class="status-badge">CONFIRMÉ</span></div>
      </div>
    </div>

    <div class="action-buttons">
      <button class="btn" onclick="window.print()">Imprimer / Sauvegarder en PDF</button>
    </div>

    <div class="footer">
      <p><strong>AIDONS LES</strong> — Plateforme humanitaire transparente</p>
      <p>Chaque don tracé, chaque impact vérifié</p>
      <p style="margin-top: 8px; font-size: 0.78rem;">Yaoundé, Cameroun — contact@aidonsles.org</p>
    </div>
  </div>
</body>
</html>
    `;
  }
    /**
   * Génère une référence unique pour un don
   */
  private generateReference(): string {
    const year = new Date().getFullYear();
    const suffix = String(Date.now()).slice(-6);
    return `DON-${year}-${suffix}`;
  }

  /**
   * Crée un nouveau don
   */
  async create(data: {
    userId: string;
    actionId: string;
    amount: number;
    currency: string;
    method: string;
    message?: string;
    donorFirstName?: string;
    donorLastName?: string;
    donorEmail?: string;
    donorPhone?: string;
    donorCountry?: string;
  }) {
    const reference = this.generateReference();

    const donation = await this.prisma.donation.create({
      data: {
        reference,
        userId: data.userId,
        actionId: data.actionId,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: 'PENDING',
        message: data.message,
        donorFirstName: data.donorFirstName,
        donorLastName: data.donorLastName,
        donorEmail: data.donorEmail,
        donorPhone: data.donorPhone,
        donorCountry: data.donorCountry,
      },
      include: {
        action: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            city: true,
          },
        },
      },
    });

    return donation;
  }

  /**
   * Confirme un don (simulation de paiement)
   */
  async confirm(donationId: string, userId: string) {
    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, userId },
    });

    if (!donation) {
      throw new NotFoundException('Don introuvable');
    }

    if (donation.status === 'CONFIRMED') {
      return donation;
    }

    const updated = await this.prisma.donation.update({
      where: { id: donationId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Mettre à jour le montant collecté de l'action
    if (donation.actionId) {
      await this.prisma.action.update({
        where: { id: donation.actionId },
        data: {
          collected: {
            increment: Number(donation.amount),
          },
        },
      });
    }

    return updated;
  }
}