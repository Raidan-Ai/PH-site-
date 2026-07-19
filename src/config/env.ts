import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || 'insecure-default-change-me-in-settings',
  appUrl: process.env.APP_URL || '',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  },
  ai: {
    geminiKey: process.env.GEMINI_API_KEY,
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    primaryModel: process.env.AI_MODEL_PRIMARY || 'gpt-4o-mini',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || 'web@ph-ye.org',
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'default_pass',
    from: process.env.SMTP_FROM || 'web@ph-ye.org',
  }
};

// Validation
if (config.isProd && config.jwtSecret === 'insecure-default-change-me-in-settings') {
  console.warn('\x1b[31mCRITICAL WARNING: JWT_SECRET is using insecure fallback in production!\x1b[0m');
}
