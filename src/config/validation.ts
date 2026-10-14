import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_URL: Joi.string().uri().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5500'),

  // Base de données
  DATABASE_URL: Joi.string().required(),

  // Redis (optionnel pour l'instant)
  REDIS_URL: Joi.string().optional().allow(''),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Cookies
  COOKIE_SECRET: Joi.string().min(32).required(),
  COOKIE_DOMAIN: Joi.string().default('localhost'),
  COOKIE_SECURE: Joi.boolean().default(false),

  // Admin 2FA
  ADMIN_2FA_ISSUER: Joi.string().default('AIDONS LES Admin'),

  // Paiements (optionnels pour l'instant)
  NOTCHPAY_PUBLIC_KEY: Joi.string().allow('').optional(),
  NOTCHPAY_SECRET_KEY: Joi.string().allow('').optional(),
  NOTCHPAY_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  NOTCHPAY_API_URL: Joi.string().uri().optional(),
  STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  STRIPE_PUBLIC_KEY: Joi.string().allow('').optional(),

  // Stockage (optionnel pour l'instant)
  R2_ACCOUNT_ID: Joi.string().allow('').optional(),
  R2_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  R2_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  R2_BUCKET: Joi.string().allow('').optional(),
  R2_PUBLIC_URL: Joi.string().allow('').optional(),

  // Emails (optionnel pour l'instant)
  RESEND_API_KEY: Joi.string().allow('').optional(),
  EMAIL_FROM: Joi.string().default('AIDONS LES <noreply@aidonsles.org>'),

  // Sécurité
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
});