import { randomBytes } from 'crypto';
import { API_KEY_PREFIX, API_KEY_LENGTH } from '../constants/limits.constant';

export function generateApiKey(): { key: string; prefix: string } {
  const randomKey = randomBytes(API_KEY_LENGTH).toString('hex');
  const fullKey = `${API_KEY_PREFIX}${randomKey}`;
  const prefix = fullKey.substring(0, API_KEY_PREFIX.length + 8);

  return {
    key: fullKey,
    prefix,
  };
}
