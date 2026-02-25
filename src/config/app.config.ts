import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKeyMaxActive: parseInt(process.env.API_KEY_MAX_ACTIVE, 10) || 3,
  apiKeyDefaultExpirationDays:
    parseInt(process.env.API_KEY_DEFAULT_EXPIRATION_DAYS, 10) || 365,
}));
