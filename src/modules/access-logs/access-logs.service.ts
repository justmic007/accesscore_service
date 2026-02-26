import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccessLog } from './schemas/access-log.schema';

@Injectable()
export class AccessLogsService {
    constructor(
        @InjectModel(AccessLog.name) private accessLogModel: Model<AccessLog>,
    ) { }

    async create(logData: {
        apiKeyId: string;
        userId: string;
        endpoint: string;
        method: string;
        statusCode: number;
        ipAddress?: string;
        userAgent?: string;
    }) {
        const log = new this.accessLogModel({
            apiKeyId: new Types.ObjectId(logData.apiKeyId),
            userId: new Types.ObjectId(logData.userId),
            endpoint: logData.endpoint,
            method: logData.method,
            statusCode: logData.statusCode,
            ipAddress: logData.ipAddress,
            userAgent: logData.userAgent,
        });

        return log.save();
    }

    async findByUser(userId: string, limit = 50) {
        return this.accessLogModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ timestamp: -1 })
            .limit(limit)
            .exec();
    }

    async findByApiKey(apiKeyId: string, limit = 50) {
        return this.accessLogModel
            .find({ apiKeyId: new Types.ObjectId(apiKeyId) })
            .sort({ timestamp: -1 })
            .limit(limit)
            .exec();
    }
}
