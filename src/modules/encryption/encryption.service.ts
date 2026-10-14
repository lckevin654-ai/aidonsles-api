import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const secret = this.config.get<string>('PAYMENT_ENCRYPTION_KEY');
    if (!secret || secret.length < 32) {
      throw new Error(
        'PAYMENT_ENCRYPTION_KEY manquant ou trop court (min 32 caractères)',
      );
    }
    // Dériver une clé de 32 octets depuis le secret
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Chiffrer une chaîne avec AES-256-GCM
   * Retourne : iv:authTag:encryptedData (tout en hex)
   */
  encrypt(plainText: string): string {
    if (!plainText) return '';

    try {
      // Initialization Vector aléatoire de 16 octets
      const iv = crypto.randomBytes(16);

      // Créer le cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Chiffrer
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Récupérer l'authentification tag (16 octets)
      const authTag = cipher.getAuthTag();

      // Format : iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (e) {
      this.logger.error('Erreur de chiffrement', e);
      throw new Error('Impossible de chiffrer la donnée');
    }
  }

  /**
   * Déchiffrer une chaîne chiffrée avec AES-256-GCM
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';

    try {
      // Format attendu : iv:authTag:encryptedData
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Format de donnée chiffrée invalide');
      }

      const [ivHex, authTagHex, encryptedData] = parts;

      // Reconstituer les Buffers
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Créer le decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Déchiffrer
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (e) {
      this.logger.error('Erreur de déchiffrement', e);
      throw new Error('Impossible de déchiffrer la donnée');
    }
  }

  /**
   * Masquer une chaîne pour l'affichage (ex: sk_1234...abcd)
   */
  maskSecret(secret: string): string {
    if (!secret) return '';
    if (secret.length <= 8) return '••••••••';
    return `${secret.slice(0, 4)}••••••••${secret.slice(-4)}`;
  }
}