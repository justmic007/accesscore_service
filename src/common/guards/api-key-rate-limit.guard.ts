import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccessLog } from '../../modules/access-logs/schemas/access-log.schema';

@Injectable()
export class ApiKeyRateLimitGuard implements CanActivate {
    constructor(
        @InjectModel(AccessLog.name) private accessLogModel: Model<AccessLog>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKeyId = request.apiKeyId;

        if (!apiKeyId) {
            return true; // No API key, skip rate limiting
        }

        // Count requests in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const requestCount = await this.accessLogModel.countDocuments({
            apiKeyId,
            timestamp: { $gte: oneHourAgo },
        });

        const rateLimit = request.apiKey?.rateLimit || 100;

        if (requestCount >= rateLimit) {
            throw new HttpException(
                `Rate limit exceeded. Maximum ${rateLimit} requests per hour.`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return true;
    }
}
