import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../constants/limits.constant';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, BCRYPT_SALT_ROUNDS);
}

export async function compareApiKey(
  apiKey: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}
