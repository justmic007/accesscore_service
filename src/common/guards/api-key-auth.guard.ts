import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey } from '../../modules/api-keys/schemas/api-key.schema';
import { ApiKeyStatus } from '../../modules/api-keys/enums/api-key-status.enum';
import { hashApiKey } from '../utils/hash.util';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
    constructor(
        @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKey>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = this.extractApiKey(request);

        if (!apiKey) {
            throw new UnauthorizedException('API key is required');
        }

        const hashedKey = await hashApiKey(apiKey);
        const apiKeyDoc = await this.apiKeyModel.findOne({ key: hashedKey });

        if (!apiKeyDoc) {
            throw new UnauthorizedException('Invalid API key');
        }

        if (apiKeyDoc.status !== ApiKeyStatus.ACTIVE) {
            throw new UnauthorizedException('API key is not active');
        }

        if (apiKeyDoc.expiresAt && apiKeyDoc.expiresAt < new Date()) {
            throw new UnauthorizedException('API key has expired');
        }

        // Attach API key info to request for rate limiting
        request.apiKey = apiKeyDoc;
        request.apiKeyId = apiKeyDoc._id.toString();
        request.userId = apiKeyDoc.userId.toString();

        // Update last used timestamp
        apiKeyDoc.lastUsedAt = new Date();
        await apiKeyDoc.save();

        return true;
    }

    private extractApiKey(request: any): string | null {
        const authHeader = request.headers['x-api-key'] || request.headers['authorization'];
        
        if (!authHeader) {
            return null;
        }

        // Support both "Bearer <key>" and direct key
        if (authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return authHeader;
    }
}
