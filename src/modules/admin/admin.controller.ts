import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================================
  // VUE GLOBALE
  // ============================================================
  @Get('dashboard')       async getDashboard() { return this.adminService.getDashboard(); }
  @Get('finances')        async getFinances() { return this.adminService.getFinances(); }
  @Get('transactions')    async getTransactions() { return this.adminService.getTransactions(); }
  @Get('reconciliation')  async getReconciliation() { return this.adminService.getReconciliation(); }

  // ============================================================
  // UTILISATEURS
  // ============================================================
  @Get('donors')          async getDonors() { return this.adminService.getDonors(); }
  @Get('organizations')   async getOrganizations() { return this.adminService.getOrganizations(); }
  @Get('beneficiaries')   async getBeneficiaries() { return this.adminService.getBeneficiaries(); }
  @Get('administrators')  async getAdministrators() { return this.adminService.getAdministrators(); }

  // ============================================================
  // ACTIONS & DONS
  // ============================================================
  @Get('actions')         async getActions() { return this.adminService.getActions(); }
  @Get('verification')    async getVerification() { return this.adminService.getVerification(); }
  @Get('donations')       async getDonations() { return this.adminService.getDonations(); }
  @Get('tracking')        async getTracking() { return this.adminService.getTracking(); }

  // ============================================================
  // IMPACT & PREUVES
  // ============================================================
  @Get('evidence')        async getEvidence() { return this.adminService.getEvidence(); }
  @Get('reports')         async getReports() { return this.adminService.getReports(); }
  @Get('impact')          async getImpact() { return this.adminService.getImpact(); }

  // ============================================================
  // CONTENU
  // ============================================================
  @Get('content')         async getContentStudio() { return this.adminService.getContentStudio(); }
  @Get('media')           async getMedia() { return this.adminService.getMedia(); }
  @Get('cms')             async getCmsPages() { return this.adminService.getCmsPages(); }

  // ============================================================
  // CONFIANCE
  // ============================================================
  @Get('transparency')    async getTransparency() { return this.adminService.getTransparency(); }
  @Get('ledger')          async getLedger() { return this.adminService.getLedger(); }

  // ============================================================
  // SÉCURITÉ
  // ============================================================
  @Get('audit')           async getAuditLogs() { return this.adminService.getAuditLogs(); }
  @Get('fraud')           async getFraudAlerts() { return this.adminService.getFraudAlerts(); }
  @Get('security')        async getSecurityLogs() { return this.adminService.getSecurityLogs(); }
  @Get('notifications')   async getNotifications() { return this.adminService.getNotifications(); }

  // ============================================================
  // MÉDIAS — Upload / CRUD / Publier / Programmer
  // ============================================================

  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: any,
    @Body() body: any,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.adminService.uploadMedia(file, body);
  }

  @Post('media')
  async createMedia(@Body() body: any) {
    return this.adminService.createMedia(body);
  }

  @Patch('media/:id')
  async updateMedia(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateMedia(id, body);
  }

  @Delete('media/:id')
  async deleteMedia(@Param('id') id: string) {
    return this.adminService.deleteMedia(id);
  }

  @Post('media/:id/publish')
  async publishMedia(@Param('id') id: string) {
    return this.adminService.publishMedia(id);
  }

  @Post('media/:id/schedule')
  async scheduleMedia(@Param('id') id: string, @Body() body: { publishedAt: string }) {
    return this.adminService.scheduleMedia(id, body.publishedAt);
  }

  // ============================================================
  // RÉSEAUX SOCIAUX
  // ============================================================

  @Get('social-links')
  async getSocialLinks() { return this.adminService.getSocialLinks(); }

  @Patch('social-links/:platform')
  async updateSocialLink(@Param('platform') platform: string, @Body() body: any) {
    return this.adminService.updateSocialLink(platform, body);
  }

  // ============================================================
  // PAIEMENTS (config)
  // ============================================================

  @Get('payment-configs')
  async getPaymentConfigs() { return this.adminService.getPaymentConfigs(); }

  @Patch('payment-configs/:provider')
  async updatePaymentConfig(@Param('provider') provider: string, @Body() body: any) {
    return this.adminService.updatePaymentConfig(provider, body);
  }
}