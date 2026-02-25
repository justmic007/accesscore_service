import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AccessLogDocument = HydratedDocument<AccessLog>;

@Schema({ timestamps: true })
export class AccessLog {
    @Prop({ type: Types.ObjectId, ref: 'ApiKey', required: true, index: true })
    apiKeyId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    endpoint: string;

    @Prop({ required: true })
    method: string;

    @Prop({ required: true })
    statusCode: number;

    @Prop()
    ipAddress: string;

    @Prop()
    userAgent: string;

    @Prop({ type: Date, default: Date.now, index: true })
    timestamp: Date;
}

export const AccessLogSchema = SchemaFactory.createForClass(AccessLog);

// Indexes for efficient queries
AccessLogSchema.index({ apiKeyId: 1, timestamp: -1 });
AccessLogSchema.index({ userId: 1, timestamp: -1 });
