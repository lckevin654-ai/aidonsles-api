import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const otplib = require('otplib');
const { generateSecret, generateURI, verify } = otplib;
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto, Admin2FADto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Étape 1 : Vérifier email + mot de passe admin
   * Retourne un token temporaire pour la 2FA
   */
  async loginAdmin(dto: AdminLoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier que c'est bien un admin
    const adminRoles = [
      'SUPER_ADMIN',
      'ADMIN_CONTENT',
      'ADMIN_PROJECT',
      'ADMIN_PAYMENT',
      'ADMIN_AUDIT',
      'ADMIN_SUPPORT',
    ];
    if (!adminRoles.includes(user.role)) {
      throw new UnauthorizedException('Accès administrateur requis');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Compte suspendu');
    }

    // Générer un token temporaire (2FA pending)
    const tempToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, stage: '2fa' },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: '5m',
      } as any,
    );

    return {
      requires2FA: true,
      tempToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  /**
   * Étape 2 : Générer le secret TOTP pour la 1ère fois
   */
  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    const secret = generateSecret();
    const issuer =
      this.config.get<string>('admin2fa.issuer') || 'AIDONS LES Admin';
    const otpauth = generateURI({
      secret,
      label: user.email,
      issuer,
    });

    // Stocker le secret (pas encore activé)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return {
      secret,
      otpauth,
    };
  }

  /**
   * Étape 3 : Vérifier le code 2FA et activer
   */
  async verify2FA(userId: string, dto: Admin2FADto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    if (!user.twoFactorSecret) {
      throw new UnauthorizedException('2FA non configuré');
    }

    let isValid = false;
    try {
      const result = verify({
        token: dto.code,
        secret: user.twoFactorSecret,
      });
      // verify peut retourner un boolean OU une Promise selon la version
      isValid = result instanceof Promise ? await result : !!result;
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new UnauthorizedException('Code 2FA incorrect');
    }

    // Activer le 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Générer le token final
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: '7d',
      } as any,
    );

    return {
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}