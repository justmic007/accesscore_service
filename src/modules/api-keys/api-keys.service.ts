import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { ApiKey } from './schemas/api-key.schema';
import { ApiKeyStatus } from './enums/api-key-status.enum';
import { GenerateApiKeyDto } from './dto/generate-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { generateApiKey } from '../../common/utils/crypto.util';
import { hashApiKey } from '../../common/utils/hash.util';
import { AccessLogsService } from '../access-logs/access-logs.service';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKey>,
    private configService: ConfigService,
    private accessLogsService: AccessLogsService,
  ) {}

  async generate(
    userId: string,
    dto: GenerateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    // Check active key limit
    const maxActive = this.configService.get<number>('app.apiKeyMaxActive');
    const activeCount = await this.apiKeyModel.countDocuments({
      userId,
      status: ApiKeyStatus.ACTIVE,
    });

    if (activeCount >= maxActive) {
      throw new ForbiddenException(
        `Maximum active API keys exceeded. You can only have ${maxActive} active keys.`,
      );
    }

    // Generate API key
    const { key, prefix } = generateApiKey();
    const hashedKey = await hashApiKey(key);

    // Calculate expiration
    const expirationDays = this.configService.get<number>(
      'app.apiKeyDefaultExpirationDays',
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Save to database
    const apiKey = new this.apiKeyModel({
      userId,
      key: hashedKey,
      prefix,
      name: dto.name,
      status: ApiKeyStatus.ACTIVE,
      expiresAt,
    });

    const savedKey = await apiKey.save();

    // Log the operation
    try {
      await this.accessLogsService.create({
        apiKeyId: savedKey._id.toString(),
        userId,
        endpoint: '/api-keys',
        method: 'POST',
        statusCode: 201,
      });
    } catch (error) {
      // Silent fail - don't block API key creation if logging fails
    }

    return {
      id: savedKey._id.toString(),
      key, // Return full key only once
      prefix: savedKey.prefix,
      name: savedKey.name,
      status: savedKey.status,
      expiresAt: savedKey.expiresAt,
      createdAt: (savedKey as any).createdAt,
    };
  }

  async list(userId: string): Promise<ApiKeyResponseDto[]> {
    const apiKeys = await this.apiKeyModel
      .find({ userId })
      .sort({ createdAt: -1 });

    return apiKeys.map((key) => ({
      id: key._id.toString(),
      prefix: key.prefix,
      name: key.name,
      status: key.status,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      createdAt: (key as any).createdAt,
    }));
  }

  async revoke(userId: string, keyId: string): Promise<{ message: string }> {
    const apiKey = await this.apiKeyModel.findById(keyId);

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized to revoke this API key');
    }

    if (apiKey.status === ApiKeyStatus.REVOKED) {
      throw new ForbiddenException('API key is already revoked');
    }

    apiKey.status = ApiKeyStatus.REVOKED;
    apiKey.revokedAt = new Date();
    await apiKey.save();

    // Log the operation
    try {
      await this.accessLogsService.create({
        apiKeyId: keyId,
        userId,
        endpoint: `/api-keys/${keyId}`,
        method: 'DELETE',
        statusCode: 200,
      });
    } catch (error) {
      // Silent fail
    }

    return { message: 'API key revoked successfully' };
  }

  async rotate(
    userId: string,
    keyId: string,
  ): Promise<ApiKeyResponseDto> {
    const oldKey = await this.apiKeyModel.findById(keyId);

    if (!oldKey) {
      throw new NotFoundException('API key not found');
    }

    if (oldKey.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized to rotate this API key');
    }

    if (oldKey.status === ApiKeyStatus.REVOKED) {
      throw new ForbiddenException('Cannot rotate a revoked API key');
    }

    // Generate new key
    const { key, prefix } = generateApiKey();
    const hashedKey = await hashApiKey(key);

    // Calculate expiration
    const expirationDays = this.configService.get<number>(
      'app.apiKeyDefaultExpirationDays',
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create new key
    const newApiKey = new this.apiKeyModel({
      userId,
      key: hashedKey,
      prefix,
      name: oldKey.name,
      status: ApiKeyStatus.ACTIVE,
      expiresAt,
    });

    const savedNewKey = await newApiKey.save();

    // Revoke old key
    oldKey.status = ApiKeyStatus.REVOKED;
    oldKey.revokedAt = new Date();
    await oldKey.save();

    // Log the operation
    try {
      await this.accessLogsService.create({
        apiKeyId: savedNewKey._id.toString(),
        userId,
        endpoint: `/api-keys/${keyId}/rotate`,
        method: 'POST',
        statusCode: 200,
      });
    } catch (error) {
      // Silent fail
    }

    return {
      id: savedNewKey._id.toString(),
      key, // Return full key only once
      prefix: savedNewKey.prefix,
      name: savedNewKey.name,
      status: savedNewKey.status,
      expiresAt: savedNewKey.expiresAt,
      createdAt: (savedNewKey as any).createdAt,
    };
  }
}
