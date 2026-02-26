import { ApiKeyStatus } from '../enums/api-key-status.enum';

export class ApiKeyResponseDto {
  id: string;
  prefix: string;
  name?: string;
  status: ApiKeyStatus;
  rateLimit: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  key?: string; // Only included when generating/rotating
}
