import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto, Admin2FADto } from './dto/admin-login.dto';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Étape 1 : Login admin (email + password)
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.loginAdmin(dto);
  }

  /**
   * Étape 2 : Setup 2FA (retourne le secret)
   */
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  async setup2FA(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Token manquant');

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      } as any);
      if (payload.stage !== '2fa') {
        throw new UnauthorizedException('Token invalide');
      }
      return this.adminAuthService.setup2FA(payload.sub);
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  /**
   * Étape 3 : Vérifier le code 2FA
   */
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verify2FA(
    @Headers('authorization') auth: string,
    @Body() dto: Admin2FADto,
  ) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Token manquant');

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      } as any);
      if (payload.stage !== '2fa') {
        throw new UnauthorizedException('Token invalide');
      }
      return this.adminAuthService.verify2FA(payload.sub, dto);
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}