import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly encryption: EncryptionService,
  ) {}

  async getDashboard() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      donationsToday, donationsMonth, totalTransactions, activeActions,
      completedActions, totalUsers, totalDonors, totalBeneficiariesAgg,
      totalOrganizations, verifiedOrganizations, totalBeneficiariesCount,
    ] = await Promise.all([
      this.prisma.donation.aggregate({
        where: { status: 'CONFIRMED', confirmedAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      this.prisma.donation.aggregate({
        where: { status: 'CONFIRMED', confirmedAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.donation.count(),
      this.prisma.action.count({
        where: { status: { in: ['PLANIFIEE', 'EN_COURS', 'OUVERTE_AUX_DONS'] } },
      }),
      this.prisma.action.count({ where: { status: 'REALISEE' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'DONOR' } }),
      this.prisma.action.aggregate({ _sum: { beneficiaries: true } }),
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { verified: true } }),
      this.prisma.beneficiary.count(),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDonations = await this.prisma.donation.findMany({
      where: { status: 'CONFIRMED', confirmedAt: { gte: sevenDaysAgo } },
      select: { amount: true, confirmedAt: true },
    });

    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const chartMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      chartMap.set(days[d.getDay()], 0);
    }

    recentDonations.forEach((don) => {
      if (don.confirmedAt) {
        const d = new Date(don.confirmedAt);
        const label = days[d.getDay()];
        chartMap.set(label, (chartMap.get(label) || 0) + Number(don.amount));
      }
    });

    const chart = Array.from(chartMap.entries()).map(([label, value]) => ({
      label,
      value: Math.round(value / 1000),
    }));

    return {
      donationsToday: Number(donationsToday._sum.amount || 0),
      donationsMonth: Number(donationsMonth._sum.amount || 0),
      transactions: totalTransactions,
      activeActions,
      completedActions,
      organizations: totalOrganizations,
      verifiedOrganizations,
      beneficiaries: totalBeneficiariesCount,
      totalBeneficiariesFromActions: totalBeneficiariesAgg._sum.beneficiaries || 0,
      donors: totalDonors,
      totalUsers,
      currency: 'XAF',
      chart,
      generatedAt: new Date().toISOString(),
    };
  }

  async getDonations() {
    const donations = await this.prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        action: { select: { id: true, title: true } },
      },
    });

    return donations.map((d) => ({
      id: d.id, reference: d.reference, amount: Number(d.amount),
      currency: d.currency, method: d.method, status: d.status,
      donorFirstName: d.donorFirstName, donorLastName: d.donorLastName,
      donorEmail: d.donorEmail, isAnonymous: d.isAnonymous,
      createdAt: d.createdAt, confirmedAt: d.confirmedAt,
      user: d.user, action: d.action,
    }));
  }

  async getDonors() {
    const donors = await this.prisma.user.findMany({
      where: { role: 'DONOR' },
      orderBy: { createdAt: 'desc' },
      include: {
        donations: {
          where: { status: 'CONFIRMED' },
          select: { amount: true, currency: true, createdAt: true },
        },
      },
    });

    return donors.map((u) => {
      const totalByCurrency = new Map<string, number>();
      let lastDonationDate: Date | null = null;

      u.donations.forEach((d) => {
        totalByCurrency.set(d.currency, (totalByCurrency.get(d.currency) || 0) + Number(d.amount));
        if (!lastDonationDate || d.createdAt > lastDonationDate) lastDonationDate = d.createdAt;
      });

      return {
        id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
        phone: u.phone, country: u.country, status: u.status, createdAt: u.createdAt,
        donationCount: u.donations.length,
        totals: Array.from(totalByCurrency.entries()).map(([currency, amount]) => ({ currency, amount })),
        lastDonationAt: lastDonationDate,
      };
    });
  }

  async getTransactions() {
    const transactions = await this.prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, reference: true, amount: true, currency: true,
        method: true, status: true, donorFirstName: true, donorLastName: true,
        donorEmail: true, createdAt: true, confirmedAt: true,
      },
    });

    return transactions.map((t) => ({
      id: t.id, reference: t.reference, amount: Number(t.amount),
      currency: t.currency, method: t.method, status: t.status,
      donorName: t.donorFirstName
        ? `${t.donorFirstName} ${t.donorLastName || ''}`.trim()
        : t.donorEmail || 'Anonyme',
      donorEmail: t.donorEmail, createdAt: t.createdAt, confirmedAt: t.confirmedAt,
    }));
  }

  async getActions() {
    const actions = await this.prisma.action.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return actions.map((a) => ({
      id: a.id, title: a.title, slug: a.slug, description: a.description,
      type: a.type, status: a.status, date: a.date, country: a.country,
      city: a.city, objective: a.objective, beneficiaries: a.beneficiaries,
      budget: Number(a.budget), collected: Number(a.collected),
      used: Number(a.used), currency: a.currency, imageUrl: a.imageUrl,
      createdAt: a.createdAt,
    }));
  }

  async getAdministrators() {
    const adminRoles = [
      'SUPER_ADMIN', 'ADMIN_CONTENT', 'ADMIN_PROJECT',
      'ADMIN_PAYMENT', 'ADMIN_AUDIT', 'ADMIN_SUPPORT',
    ];

    const admins = await this.prisma.user.findMany({
      where: { role: { in: adminRoles } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, status: true, twoFactorEnabled: true, createdAt: true,
      },
    });

    return admins.map((a) => ({
      id: a.id, name: `${a.firstName} ${a.lastName}`.trim(),
      email: a.email, role: a.role, status: a.status,
      twoFactorEnabled: a.twoFactorEnabled, createdAt: a.createdAt,
    }));
  }

  async getOrganizations() {
    const orgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return orgs.map((o) => ({
      id: o.id, name: o.name, slug: o.slug, description: o.description,
      type: o.type, email: o.email, phone: o.phone, website: o.website,
      address: o.address, city: o.city, country: o.country, logoUrl: o.logoUrl,
      verified: o.verified, status: o.status, since: o.since,
      contactName: o.contactName, contactEmail: o.contactEmail, createdAt: o.createdAt,
    }));
  }

  async getBeneficiaries() {
    const beneficiaries = await this.prisma.beneficiary.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return beneficiaries.map((b) => ({
      id: b.id, orgId: b.orgId, name: b.name, type: b.type,
      description: b.description, people: b.people, region: b.region,
      city: b.city, country: b.country, status: b.status,
      photoUrl: b.photoUrl, actionId: b.actionId, createdAt: b.createdAt,
    }));
  }

  async getEvidence() {
    const evidences = await this.prisma.evidence.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return evidences.map((e) => ({
      id: e.id, actionId: e.actionId, donationId: e.donationId,
      type: e.type, title: e.title, description: e.description,
      fileUrl: e.fileUrl, thumbnailUrl: e.thumbnailUrl, mimeType: e.mimeType,
      size: e.size, uploadedBy: e.uploadedBy, status: e.status,
      validatedAt: e.validatedAt, validatedBy: e.validatedBy, createdAt: e.createdAt,
    }));
  }

  async getReports() {
    const reports = await this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((r) => ({
      id: r.id, title: r.title, slug: r.slug, actionId: r.actionId,
      summary: r.summary, content: r.content, fileUrl: r.fileUrl,
      author: r.author, status: r.status, publishedAt: r.publishedAt,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
    }));
  }

  async getComplaints() {
    const complaints = await this.prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return complaints.map((c) => ({
      id: c.id, category: c.category, subject: c.subject,
      description: c.description, priority: c.priority, status: c.status,
      reporterName: c.reporterName, reporterEmail: c.reporterEmail,
      reporterPhone: c.reporterPhone, assignedTo: c.assignedTo,
      resolution: c.resolution, resolvedAt: c.resolvedAt, createdAt: c.createdAt,
    }));
  }

  async getFraudAlerts() {
    const alerts = await this.prisma.fraudAlert.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((f) => ({
      id: f.id, type: f.type, level: f.level, reference: f.reference,
      description: f.description, status: f.status,
      resolvedBy: f.resolvedBy, resolvedAt: f.resolvedAt, createdAt: f.createdAt,
    }));
  }

  async getLedger() {
    const entries = await this.prisma.ledgerEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return entries.map((l) => ({
      id: l.id, donationId: l.donationId, actionId: l.actionId,
      amount: Number(l.amount), currency: l.currency, hash: l.hash,
      previousHash: l.previousHash, type: l.type, verified: l.verified,
      createdAt: l.createdAt,
    }));
  }

  async getMedia() {
    const media = await this.prisma.mediaItem.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return media.map((m) => ({
      id: m.id, name: m.name, type: m.type, url: m.url,
      thumbnailUrl: m.thumbnailUrl, mimeType: m.mimeType, size: m.size,
      width: m.width, height: m.height, duration: m.duration,
      actionId: m.actionId, uploadedBy: m.uploadedBy,
      status: m.status, publishedAt: m.publishedAt, createdAt: m.createdAt,
    }));
  }

  async getCmsPages() {
    const pages = await this.prisma.cmsPage.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return pages.map((p) => ({
      id: p.id, title: p.title, slug: p.slug, content: p.content,
      metaTitle: p.metaTitle, metaDescription: p.metaDescription,
      status: p.status, publishedAt: p.publishedAt,
      createdAt: p.createdAt, updatedAt: p.updatedAt,
    }));
  }

  async getFinances() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalYear, totalMonth, confirmed, pending, failed, refunded, methodGroups] =
      await Promise.all([
        this.prisma.donation.aggregate({
          where: { status: 'CONFIRMED', confirmedAt: { gte: startOfYear } },
          _sum: { amount: true },
        }),
        this.prisma.donation.aggregate({
          where: { status: 'CONFIRMED', confirmedAt: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
        this.prisma.donation.count({ where: { status: 'CONFIRMED' } }),
        this.prisma.donation.count({ where: { status: 'PENDING' } }),
        this.prisma.donation.count({ where: { status: 'FAILED' } }),
        this.prisma.donation.count({ where: { status: 'REFUNDED' } }),
        this.prisma.donation.groupBy({
          by: ['method'],
          where: { status: 'CONFIRMED' },
          _sum: { amount: true },
          _count: { _all: true },
        }),
      ]);

    return {
      totalYear: Number(totalYear._sum.amount || 0),
      totalMonth: Number(totalMonth._sum.amount || 0),
      confirmed, pending, failed, refunded,
      totalTransactions: confirmed + pending + failed + refunded,
      byMethod: methodGroups.map((m) => ({
        method: m.method,
        total: Number(m._sum.amount || 0),
        count: m._count._all,
      })),
      currency: 'XAF',
      generatedAt: new Date().toISOString(),
    };
  }

  async getReconciliation() {
    const confirmedDonations = await this.prisma.donation.findMany({
      where: { status: 'CONFIRMED' },
      select: { id: true, reference: true, amount: true, currency: true },
    });

    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      select: { donationId: true, amount: true, hash: true },
    });

    const ledgerByDonation = new Map(
      ledgerEntries.map((l) => [l.donationId, l]),
    );

    const anomalies: any[] = [];

    confirmedDonations.forEach((d) => {
      const ledger = ledgerByDonation.get(d.id);
      if (!ledger) {
        anomalies.push({
          id: `REC-${d.id}`,
          type: 'Paiement confirmé mais absent du ledger',
          ref: d.reference, amount: Number(d.amount),
          severity: 'high', status: 'OPEN',
        });
      } else if (Number(ledger.amount) !== Number(d.amount)) {
        anomalies.push({
          id: `REC-${d.id}`,
          type: 'Montant différent entre don et ledger',
          ref: d.reference, amount: Number(d.amount),
          severity: 'medium', status: 'OPEN',
        });
      }
    });

    return {
      anomalies,
      totalChecked: confirmedDonations.length,
      totalLedger: ledgerEntries.length,
      generatedAt: new Date().toISOString(),
    };
  }

  async getVerification() {
    const [pendingOrgs, pendingEvidence, reviewOrgs] = await Promise.all([
      this.prisma.organization.count({ where: { status: 'PENDING' } }),
      this.prisma.evidence.count({ where: { status: 'PENDING' } }),
      this.prisma.organization.count({ where: { status: 'REVIEW' } }),
    ]);

    const orgsToVerify = await this.prisma.organization.findMany({
      where: { verified: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const evidenceToVerify = await this.prisma.evidence.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      stats: { pendingOrgs, pendingEvidence, reviewOrgs },
      organizations: orgsToVerify.map((o) => ({
        id: o.id, name: o.name, city: o.city, country: o.country,
        status: o.status, createdAt: o.createdAt,
      })),
      evidences: evidenceToVerify.map((e) => ({
        id: e.id, title: e.title, type: e.type,
        status: e.status, createdAt: e.createdAt,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async getTracking() {
    const recentDonations = await this.prisma.donation.findMany({
      where: { status: 'CONFIRMED' },
      orderBy: { confirmedAt: 'desc' },
      take: 50,
      select: {
        id: true, reference: true, amount: true, currency: true, method: true,
        donorFirstName: true, donorLastName: true, createdAt: true,
        confirmedAt: true, actionId: true,
      },
    });

    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      select: { donationId: true, hash: true, createdAt: true },
    });

    const ledgerByDonation = new Map(
      ledgerEntries.map((l) => [l.donationId, l]),
    );

    return recentDonations.map((d) => {
      const ledger = ledgerByDonation.get(d.id);
      return {
        id: d.id, reference: d.reference, amount: Number(d.amount),
        currency: d.currency, method: d.method,
        donorName: d.donorFirstName
          ? `${d.donorFirstName} ${d.donorLastName || ''}`.trim()
          : 'Anonyme',
        createdAt: d.createdAt, confirmedAt: d.confirmedAt, actionId: d.actionId,
        steps: [
          { step: 'Don créé', done: true, date: d.createdAt },
          { step: 'Paiement confirmé', done: !!d.confirmedAt, date: d.confirmedAt },
          { step: 'Fonds affectés', done: !!d.actionId, date: d.confirmedAt },
          { step: 'Inscrit au ledger', done: !!ledger, date: ledger?.createdAt || null, hash: ledger?.hash || null },
        ],
      };
    });
  }

  async getImpact() {
    const [stats, actionsAgg] = await Promise.all([
      this.prisma.impactStats.findFirst({ orderBy: { updatedAt: 'desc' } }),
      this.prisma.action.aggregate({
        _sum: { beneficiaries: true },
        _count: { _all: true },
      }),
    ]);

    const completedActions = await this.prisma.action.count({ where: { status: 'REALISEE' } });
    const activeActions = await this.prisma.action.count({
      where: { status: { in: ['PLANIFIEE', 'EN_COURS', 'OUVERTE_AUX_DONS'] } },
    });
    const beneficiariesCount = await this.prisma.beneficiary.count();
    const totalPeople = await this.prisma.beneficiary.aggregate({
      _sum: { people: true },
    });

    return {
      donors: stats?.donors || 0,
      actionsCompleted: completedActions,
      activeActions,
      totalActions: actionsAgg._count._all,
      peopleHelped: Number(totalPeople._sum.people || 0),
      localities: stats?.localities || 0,
      beneficiariesCount,
      totalBeneficiariesFromActions: actionsAgg._sum.beneficiaries || 0,
      updatedAt: stats?.updatedAt || new Date(),
    };
  }

  async getContentStudio() {
    const [newsCount, galleryCount, cmsCount, publishedCms, publishedNews] =
      await Promise.all([
        this.prisma.news.count(),
        this.prisma.galleryItem.count(),
        this.prisma.cmsPage.count(),
        this.prisma.cmsPage.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.news.count(),
      ]);

    const recentNews = await this.prisma.news.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 10,
      select: { id: true, title: true, slug: true, publishedAt: true },
    });

    const recentGallery = await this.prisma.galleryItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, title: true, type: true,
        category: true, date: true, url: true,
      },
    });

    const recentCms = await this.prisma.cmsPage.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { id: true, title: true, slug: true, status: true, updatedAt: true },
    });

    return {
      stats: { news: newsCount, gallery: galleryCount, cms: cmsCount, publishedCms, publishedNews },
      recentNews, recentGallery, recentCms,
      generatedAt: new Date().toISOString(),
    };
  }

  async getAuditLogs() {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return logs.map((l) => ({
      id: l.id, userId: l.userId, userEmail: l.userEmail,
      action: l.action, resource: l.resource, resourceId: l.resourceId,
      details: l.details, ipAddress: l.ipAddress, userAgent: l.userAgent,
      result: l.result, createdAt: l.createdAt,
    }));
  }

  async getSecurityLogs() {
    const logs = await this.prisma.securityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const [totalLogs, errorLogs, warningLogs] = await Promise.all([
      this.prisma.securityLog.count(),
      this.prisma.securityLog.count({ where: { level: 'ERROR' } }),
      this.prisma.securityLog.count({ where: { level: 'WARNING' } }),
    ]);

    const activeSessions = await this.prisma.session.count({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
    });

    return {
      stats: { totalLogs, errorLogs, warningLogs, activeSessions },
      logs: logs.map((l) => ({
        id: l.id, event: l.event, level: l.level, userId: l.userId,
        userEmail: l.userEmail, ipAddress: l.ipAddress,
        description: l.description, createdAt: l.createdAt,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async getNotifications() {
    const notifications = await this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const [total, unread] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { read: false } }),
    ]);

    return {
      stats: { total, unread },
      notifications: notifications.map((n) => ({
        id: n.id, userId: n.userId, title: n.title, message: n.message,
        type: n.type, category: n.category, link: n.link,
        read: n.read, readAt: n.readAt, priority: n.priority,
        createdAt: n.createdAt,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async getTransparency() {
    const [orgs, donations, actions, reports] = await Promise.all([
      this.prisma.organization.count({ where: { verified: true } }),
      this.prisma.donation.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      this.prisma.action.aggregate({
        _sum: { collected: true, used: true, budget: true },
        _count: { _all: true },
      }),
      this.prisma.report.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const totalCollected = Number(actions._sum.collected || 0);
    const totalUsed = Number(actions._sum.used || 0);
    const totalBudget = Number(actions._sum.budget || 0);
    const aidDirecte = Math.round(totalCollected * 0.8);
    const logistique = Math.round(totalCollected * 0.15);
    const admin = Math.round(totalCollected * 0.05);

    return {
      stats: {
        verifiedOrganizations: orgs,
        totalDonations: Number(donations._sum.amount || 0),
        totalActions: actions._count._all,
        totalBudget,
        totalCollected,
        totalUsed,
        publishedReports: reports,
      },
      repartition: { aidDirecte, logistique, admin },
      generatedAt: new Date().toISOString(),
    };
  }

  // ============================================================
  // MÉDIAS — Upload / CRUD / Publier / Programmer
  // ============================================================

  async uploadMedia(
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    body: { title?: string; actionId?: string; status?: string },
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    let resourceType: 'image' | 'video' | 'raw' = 'image';
    if (file.mimetype.startsWith('video/')) resourceType = 'video';
    else if (file.mimetype === 'application/pdf') resourceType = 'raw';
    else if (!file.mimetype.startsWith('image/')) resourceType = 'raw';

    const uploaded = await this.cloudinary.uploadBuffer(file.buffer, {
      folder: 'aidonsles/media',
      resourceType,
    });

    const media = await this.prisma.mediaItem.create({
      data: {
        name: body.title || file.originalname,
        type: resourceType === 'image' ? 'image' : resourceType === 'video' ? 'video' : 'pdf',
        url: uploaded.secure_url,
        thumbnailUrl: resourceType === 'image' ? uploaded.secure_url : null,
        mimeType: file.mimetype,
        size: file.size,
        width: uploaded.width || null,
        height: uploaded.height || null,
        actionId: body.actionId || null,
        status: body.status || 'DRAFT',
      },
    });

    return {
      success: true,
      media: {
        id: media.id,
        name: media.name,
        type: media.type,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        size: media.size,
        width: media.width,
        height: media.height,
        status: media.status,
        createdAt: media.createdAt,
        cloudinaryPublicId: uploaded.public_id,
      },
    };
  }

  async createMedia(data: {
    name: string;
    type: string;
    url: string;
    thumbnailUrl?: string;
    actionId?: string;
    status?: string;
  }) {
    return this.prisma.mediaItem.create({
      data: {
        name: data.name,
        type: data.type,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        actionId: data.actionId,
        status: data.status || 'DRAFT',
      },
    });
  }

  async updateMedia(id: string, data: {
    name?: string;
    status?: string;
    actionId?: string;
    publishedAt?: Date;
  }) {
    const media = await this.prisma.mediaItem.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Média introuvable');

    return this.prisma.mediaItem.update({
      where: { id },
      data: {
        name: data.name,
        status: data.status,
        actionId: data.actionId,
        publishedAt: data.publishedAt,
      },
    });
  }

  async deleteMedia(id: string) {
    const media = await this.prisma.mediaItem.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Média introuvable');

    try {
      const urlParts = media.url.split('/upload/');
      if (urlParts.length === 2) {
        const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
        const publicId = pathAfterUpload.replace(/\.[^.]+$/, '');
        const resourceType = media.type === 'video' ? 'video' : media.type === 'pdf' ? 'raw' : 'image';
        await this.cloudinary.deleteFile(publicId, resourceType);
      }
    } catch (e) {
      // On ignore l'erreur Cloudinary
    }

    await this.prisma.mediaItem.delete({ where: { id } });
    return { success: true, deletedId: id };
  }

  async publishMedia(id: string) {
    const media = await this.prisma.mediaItem.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Média introuvable');

    return this.prisma.mediaItem.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async scheduleMedia(id: string, publishedAt: string) {
    const media = await this.prisma.mediaItem.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Média introuvable');

    const date = new Date(publishedAt);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Date de publication invalide');
    }

    return this.prisma.mediaItem.update({
      where: { id },
      data: { status: 'SCHEDULED', publishedAt: date },
    });
  }

  // ============================================================
  // RÉSEAUX SOCIAUX
  // ============================================================

  async getSocialLinks() {
    return this.prisma.socialLink.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async updateSocialLink(platform: string, data: {
    url?: string;
    enabled?: boolean;
    label?: string;
  }) {
    const existing = await this.prisma.socialLink.findUnique({
      where: { platform },
    });

    if (existing) {
      return this.prisma.socialLink.update({
        where: { platform },
        data,
      });
    }

    const labels: Record<string, string> = {
      facebook: 'Facebook', linkedin: 'LinkedIn', x: 'X (Twitter)',
      instagram: 'Instagram', tiktok: 'TikTok', whatsapp: 'WhatsApp',
    };
    const icons: Record<string, string> = {
      facebook: 'fa-facebook-f', linkedin: 'fa-linkedin-in', x: 'fa-x-twitter',
      instagram: 'fa-instagram', tiktok: 'fa-tiktok', whatsapp: 'fa-whatsapp',
    };

    return this.prisma.socialLink.create({
      data: {
        platform,
        label: data.label || labels[platform] || platform,
        url: data.url || '',
        icon: icons[platform] || 'fa-link',
        enabled: data.enabled ?? true,
        order: Object.keys(labels).indexOf(platform),
      },
    });
  }

  // ============================================================
  // PAIEMENTS (config)
  // ============================================================

  async getPaymentConfigs() {
    const configs = await this.prisma.paymentConfig.findMany({
      orderBy: { provider: 'asc' },
    });

    return configs.map((c) => ({
      id: c.id,
      provider: c.provider,
      label: c.label,
      enabled: c.enabled,
      mode: c.mode,
      publicKey: c.publicKey,
      hasSecret: !!c.secretKeyEncrypted,
      merchantId: c.merchantId,
      callbackUrl: c.callbackUrl,
      returnUrl: c.returnUrl,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async updatePaymentConfig(provider: string, data: {
    enabled?: boolean;
    mode?: string;
    publicKey?: string;
    secretKey?: string;
    merchantId?: string;
    callbackUrl?: string;
    returnUrl?: string;
  }) {
    const updateData: any = {
      enabled: data.enabled,
      mode: data.mode,
      publicKey: data.publicKey,
      merchantId: data.merchantId,
      callbackUrl: data.callbackUrl,
      returnUrl: data.returnUrl,
    };

    if (data.secretKey) {
      // ✅ Chiffrer la clé secrète avec AES-256-GCM
      updateData.secretKeyEncrypted = this.encryption.encrypt(data.secretKey);
    }

    const existing = await this.prisma.paymentConfig.findUnique({
      where: { provider },
    });

    if (existing) {
      return this.prisma.paymentConfig.update({
        where: { provider },
        data: updateData,
      });
    }

    const labels: Record<string, string> = {
      ORANGE_MONEY: 'Orange Money',
      MTN_MOMO: 'MTN Mobile Money',
      STRIPE: 'Stripe (Visa / Mastercard)',
      NOTCHPAY: 'NotchPay',
      CINETPAY: 'CinetPay',
    };

    return this.prisma.paymentConfig.create({
      data: {
        provider,
        label: labels[provider] || provider,
        ...updateData,
      },
    });
  }
}