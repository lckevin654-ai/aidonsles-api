import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateDonationDto } from './dto/create-donation.dto';

@Controller('donations')
@UseGuards(JwtAuthGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  /**
   * Récupère tous les dons de l'utilisateur connecté
   */
  @Get('me')
  async getMyDonations(@Req() req: Request) {
    const user = (req as any).user;
    return this.donationsService.findByUser(user.sub);
  }

  /**
   * Récupère les statistiques de l'utilisateur connecté
   */
  @Get('me/stats')
  async getMyStats(@Req() req: Request) {
    const user = (req as any).user;
    return this.donationsService.getStats(user.sub);
  }

  /**
   * Génère le reçu d'un don (HTML)
   */
  @Get(':id/receipt')
  async getReceipt(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user;
    const donation = await this.donationsService.getReceipt(id, user.sub);
    const html = this.donationsService.generateReceiptHTML(donation);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
    /**
   * Crée un nouveau don
   */
  @Post()
  async create(@Body() dto: CreateDonationDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.donationsService.create({
      userId: user.sub,
      ...dto,
    });
  }

  /**
   * Confirme un don (simulation de paiement)
   */
  @Post(':id/confirm')
  async confirm(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.donationsService.confirm(id, user.sub);
  }
}