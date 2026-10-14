export default () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5500',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cookies: {
    secret: process.env.COOKIE_SECRET,
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    secure: process.env.COOKIE_SECURE === 'true',
  },
  admin2fa: {
    issuer: process.env.ADMIN_2FA_ISSUER || 'AIDONS LES Admin',
  },
  payments: {
    notchpay: {
      publicKey: process.env.NOTCHPAY_PUBLIC_KEY || '',
      secretKey: process.env.NOTCHPAY_SECRET_KEY || '',
      webhookSecret: process.env.NOTCHPAY_WEBHOOK_SECRET || '',
      apiUrl: process.env.NOTCHPAY_API_URL || 'https://api.notchpay.co',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    },
  },
  storage: {
    r2: {
      accountId: process.env.R2_ACCOUNT_ID || '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucket: process.env.R2_BUCKET || '',
      publicUrl: process.env.R2_PUBLIC_URL || '',
    },
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'AIDONS LES <noreply@aidonsles.org>',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});