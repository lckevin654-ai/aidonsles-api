import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload un fichier depuis un buffer
   */
  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
      publicId?: string;
    } = {},
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'aidonsles',
          resource_type: options.resourceType || 'auto',
          public_id: options.publicId,
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary: no result'));
          }
          resolve(result);
        },
      );
      uploadStream.end(buffer);
    });
  }

  /**
   * Supprime un fichier par son publicId
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType, invalidate: true },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary delete error', error);
            return reject(error);
          }
          resolve(result);
        },
      );
    });
  }

  /**
   * Génère une URL optimisée avec transformations
   */
  getOptimizedUrl(publicId: string, options?: { width?: number; height?: number; quality?: string }) {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: options?.quality || 'auto',
      width: options?.width,
      height: options?.height,
      crop: 'limit',
      secure: true,
    });
  }
}